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
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { fileName, fileType, fileSize, fileData, recipientEmail, description, otpValidityMinutes } = await req.json();

    // Get user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Convert file data back to Uint8Array
    const fileBuffer = new Uint8Array(fileData);

    // Calculate SHA-256 hash of original file
    const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const originalFileHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Generate all keys and IVs in parallel for better performance
    const [aesKey, salt, fileIv, keyIv] = await Promise.all([
      crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      ),
      Promise.resolve(crypto.getRandomValues(new Uint8Array(16))),
      Promise.resolve(crypto.getRandomValues(new Uint8Array(12))),
      Promise.resolve(crypto.getRandomValues(new Uint8Array(12)))
    ]);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Encrypt file with AES-GCM
    const encryptedFile = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: fileIv },
      aesKey,
      fileBuffer
    );

    // Derive KEK from OTP using PBKDF2
    const otpEncoder = new TextEncoder();
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
      true,
      ["wrapKey", "unwrapKey"]
    );

    // Wrap (encrypt) AES key with KEK
    const wrappedKey = await crypto.subtle.wrapKey(
      "raw",
      aesKey,
      kek,
      { name: "AES-GCM", iv: keyIv }
    );

    // Hash OTP with SHA-256 for storage
    const otpHashBuffer = await crypto.subtle.digest("SHA-256", otpEncoder.encode(otp));
    const otpHashArray = Array.from(new Uint8Array(otpHashBuffer));
    const otpHash = otpHashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Convert to base64 for storage
    const encryptedAesKeyB64 = btoa(String.fromCharCode(...new Uint8Array(wrappedKey)));
    const saltB64 = btoa(String.fromCharCode(...salt));
    const fileIvB64 = btoa(String.fromCharCode(...fileIv));
    const keyIvB64 = btoa(String.fromCharCode(...keyIv));

    // Generate unique filename
    const fileId = crypto.randomUUID();
    const encryptedFileName = `${user.id}/${fileId}`;

    // Upload encrypted file to storage
    const { error: uploadError } = await supabaseClient.storage
      .from("encrypted-files")
      .upload(encryptedFileName, new Blob([encryptedFile]), {
        contentType: "application/octet-stream",
      });

    if (uploadError) throw uploadError;

    // Calculate OTP expiry
    const otpExpiresAt = new Date(Date.now() + otpValidityMinutes * 60000);

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from("files")
      .insert({
        id: fileId,
        user_id: user.id,
        original_filename: fileName,
        encrypted_filename: encryptedFileName,
        file_size: fileSize,
        file_mimetype: fileType,
        original_file_hash: originalFileHash,
        encrypted_aes_key: encryptedAesKeyB64,
        key_salt: saltB64,
        file_iv: fileIvB64,
        key_iv: keyIvB64,
        otp_hash: otpHash,
        otp_created_at: new Date().toISOString(),
        otp_expires_at: otpExpiresAt.toISOString(),
        recipient_email: recipientEmail,
        file_description: description || null,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Send OTP via email asynchronously (don't wait - faster response)
    const emailPromise = supabaseClient.functions.invoke("send-otp-email", {
      body: {
        recipientEmail,
        otp,
        fileName,
        fileId,
        senderEmail: user.email,
        expiryMinutes: otpValidityMinutes,
      },
    });

    // Log email status after response sent
    emailPromise.then(({ error: emailError }) => {
      if (emailError) {
        console.error("Email sending failed:", emailError);
      } else {
        console.log("OTP email sent successfully to:", recipientEmail);
      }
    }).catch(err => console.error("Email error:", err));

    // Log upload and update storage in parallel (non-blocking)
    Promise.all([
      supabaseClient.from("access_logs").insert({
        file_id: fileId,
        user_id: user.id,
        access_type: "upload",
        access_status: "success",
      }),
      supabaseClient
        .from("profiles")
        .select("storage_used")
        .eq("id", user.id)
        .limit(1)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            return supabaseClient
              .from("profiles")
              .update({ storage_used: (profile.storage_used || 0) + fileSize })
              .eq("id", user.id);
          }
        })
    ]).catch(err => console.error("Background task error:", err));

    return new Response(
      JSON.stringify({ success: true, fileId }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
