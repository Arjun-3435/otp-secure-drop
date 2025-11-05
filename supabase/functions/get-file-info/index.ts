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

    const { fileId } = await req.json();

    // Get file metadata (public info only)
    const { data: file, error: fileError } = await supabaseClient
      .from("files")
      .select("original_filename, file_size, upload_timestamp, otp_expires_at, max_access_attempts, access_count, file_description, file_status")
      .eq("id", fileId)
      .single();

    if (fileError || !file) throw new Error("File not found");

    // Check if file is still accessible
    if (file.file_status !== "active") {
      throw new Error("File is no longer accessible");
    }

    return new Response(
      JSON.stringify(file),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get file info" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
