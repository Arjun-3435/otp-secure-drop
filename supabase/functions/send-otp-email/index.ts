import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipientEmail, otp, fileName, fileId, senderEmail, expiryMinutes } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const accessLink = `${supabaseUrl.replace("/v1", "")}/access/${fileId}`;

    // Send email using Gmail SMTP via fetch to a relay service or direct SMTP
    // For now, using a simple implementation - in production, use Resend or SendGrid
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #1e3a8a, #06b6d4); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .otp-box { background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: bold; color: #0369a1; letter-spacing: 8px; margin: 10px 0; }
            .file-info { background-color: #f9fafb; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #1e3a8a, #06b6d4); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .warning { background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Secure File Access Code</h1>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">You've received a secure file!</h2>
              <p style="color: #4b5563; font-size: 16px;">
                <strong>${senderEmail}</strong> has shared a secure file with you using SecureShare.
              </p>
              
              <div class="file-info">
                <p style="margin: 0; color: #1f2937;">
                  <strong>File:</strong> ${fileName}
                </p>
              </div>

              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">Your One-Time Access Code:</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Valid for ${expiryMinutes} minutes</p>
              </div>

              <div style="text-align: center;">
                <a href="${accessLink}" class="button" style="color: #ffffff;">Access File Now</a>
              </div>

              <div class="warning">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ <strong>Security Notice:</strong> Do not share this code with anyone. This file is encrypted and can only be accessed with this one-time code.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

              <h3 style="color: #1f2937;">How to access your file:</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Click the "Access File Now" button above</li>
                <li>Enter the 6-digit code shown above</li>
                <li>Your file will be decrypted and downloaded securely</li>
              </ol>
            </div>
            <div class="footer">
              <p>This email was sent by SecureShare</p>
              <p>If you didn't expect this file, you can safely ignore this email.</p>
              <p style="margin-top: 20px;">Protected by AES-256 encryption</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "SecureShare <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `🔐 Secure File Access Code - ${fileName}`,
      html: emailHtml,
    });

    console.log("Email sent successfully to:", recipientEmail);
    console.log("Resend response:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Email failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
