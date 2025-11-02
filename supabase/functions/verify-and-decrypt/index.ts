import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { fileId, otp } = await req.json();

    // Get file metadata
    const { data: file, error: fileError } = await supabaseClient
      .from("files")
      .select("*")
      .eq("id", fileId)
      .single();

    if (fileError || !file) throw new Error("File not found");

    // Check file status
    if (file.file_status !== "active") {
      throw new Error(`File is ${file.file_status}`);
    }

    // Check OTP expiry
    if (new Date(file.otp_expires_at) < new Date()) {
      await supabaseClient
        .from("files")
        .update({ file_status: "expired" })
        .eq("id", fileId);
      throw new Error("OTP has expired");
    }

    // Check access attempts
    if (file.access_count >= file.max_access_attempts) {
      throw new Error("Maximum access attempts reached");
    }

    // Hash submitted OTP
    const otpEncoder = new TextEncoder();
    const otpHashBuffer = await crypto.subtle.digest("SHA-256", otpEncoder.encode(otp));
    const otpHashArray = Array.from(new Uint8Array(otpHashBuffer));
    const submittedOtpHash = otpHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Verify OTP (constant-time comparison would be better in production)
    if (submittedOtpHash !== file.otp_hash) {
      // Log failed attempt
      await supabaseClient.from("access_logs").insert({
        file_id: fileId,
        access_type: "otp_verify",
        access_status: "failure",
        failure_reason: "Invalid OTP",
      });
      throw new Error("Invalid OTP");
    }

    // Derive KEK from OTP
    const salt = Uint8Array.from(atob(file.key_salt), c => c.charCodeAt(0));
    const keyIv = Uint8Array.from(atob(file.key_iv), c => c.charCodeAt(0));

    const otpKey = await crypto.subtle.importKey(
      "raw",
      otpEncoder.encode(otp),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const kek = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      otpKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["unwrapKey"]
    );

    // Unwrap (decrypt) the AES key
    const wrappedKey = Uint8Array.from(atob(file.encrypted_aes_key), c => c.charCodeAt(0));
    
    const aesKey = await crypto.subtle.unwrapKey(
      "raw",
      wrappedKey,
      kek,
      { name: "AES-GCM", iv: keyIv },
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    // Download encrypted file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from("encrypted-files")
      .download(file.encrypted_filename);

    if (downloadError || !fileData) throw new Error("Failed to download encrypted file");

    // Read file as ArrayBuffer
    const encryptedBuffer = await fileData.arrayBuffer();

    // Decrypt file with AES-GCM
    const fileIv = Uint8Array.from(atob(file.file_iv), c => c.charCodeAt(0));
    
    const decryptedFile = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fileIv },
      aesKey,
      encryptedBuffer
    );

    // Verify file integrity
    const decryptedArray = new Uint8Array(decryptedFile);
    const hashBuffer = await crypto.subtle.digest("SHA-256", decryptedArray);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    if (fileHash !== file.original_file_hash) {
      // Log tampering attempt
      await supabaseClient.from("access_logs").insert({
        file_id: fileId,
        access_type: "download",
        access_status: "failure",
        failure_reason: "File integrity check failed",
      });
      throw new Error("File integrity check failed - possible tampering detected");
    }

    // Update access count and log successful access
    await supabaseClient
      .from("files")
      .update({
        access_count: file.access_count + 1,
        last_access_timestamp: new Date().toISOString(),
      })
      .eq("id", fileId);

    await supabaseClient.from("access_logs").insert({
      file_id: fileId,
      access_type: "download",
      access_status: "success",
    });

    // Convert to base64 for transmission
    const base64File = btoa(String.fromCharCode(...decryptedArray));

    return new Response(
      JSON.stringify({
        success: true,
        fileData: base64File,
        filename: file.original_filename,
        mimeType: file.file_mimetype,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Verification failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
