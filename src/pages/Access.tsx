import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Download, Lock, FileText, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileInfo {
  original_filename: string;
  file_size: number;
  upload_timestamp: string;
  otp_expires_at: string;
  max_access_attempts: number;
  access_count: number;
  file_description: string | null;
}

const Access = () => {
  const { fileId } = useParams();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState("");

  useEffect(() => {
    if (fileId) {
      loadFileInfo();
    }
  }, [fileId]);

  useEffect(() => {
    if (fileInfo) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(fileInfo.otp_expires_at);
        if (expires > now) {
          setTimeRemaining(
            formatDistanceToNow(expires, { addSuffix: false, includeSeconds: true })
          );
        } else {
          setTimeRemaining("Expired");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [fileInfo]);

  const loadFileInfo = async () => {
    try {
      // We need to make this publicly accessible - create a public edge function
      const { data, error } = await supabase.functions.invoke("get-file-info", {
        body: { fileId },
      });

      if (error) throw error;
      setFileInfo(data);
    } catch (error) {
      console.error("Error loading file info:", error);
      toast.error("File not found or expired");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !fileId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-and-decrypt", {
        body: { fileId, otp },
      });

      if (error) throw error;

      // Convert base64 to blob and download
      const byteCharacters = atob(data.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || "application/octet-stream" });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("File downloaded successfully!");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error(error.message || "Invalid OTP or file expired");
    } finally {
      setLoading(false);
    }
  };

  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-pulse text-muted-foreground">Loading file information...</div>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="p-12 text-center max-w-md">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">File Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This file may have expired or been deleted
          </p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">SecureShare</span>
          </Link>
          <p className="text-muted-foreground">Secure File Access</p>
        </div>

        {/* File Info Card */}
        <Card className="p-6 mb-4 gradient-card">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1 truncate">{fileInfo.original_filename}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Size: {(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB</p>
                <p>
                  Uploaded:{" "}
                  {formatDistanceToNow(new Date(fileInfo.upload_timestamp), { addSuffix: true })}
                </p>
                {fileInfo.file_description && (
                  <p className="mt-2">{fileInfo.file_description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">OTP expires in {timeRemaining}</p>
              <p className="text-muted-foreground text-xs">
                {fileInfo.max_access_attempts - fileInfo.access_count} attempts remaining
              </p>
            </div>
          </div>
        </Card>

        {/* OTP Form */}
        <Card className="p-8 gradient-card">
          <form onSubmit={handleDownload} className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Enter Access Code</h2>
              <p className="text-sm text-muted-foreground">
                Check your email for the one-time password
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password (OTP)</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-hero gap-2"
              disabled={loading || otp.length !== 6}
            >
              <Download className="h-4 w-4" />
              {loading ? "Verifying..." : "Verify & Download"}
            </Button>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-card rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            🔒 This file is protected by AES-256 encryption
          </p>
        </div>
      </div>
    </div>
  );
};

export default Access;
