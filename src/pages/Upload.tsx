import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Upload as UploadIcon, ArrowLeft, Mail, Clock } from "lucide-react";
import { toast } from "sonner";

const Upload = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [otpValidity, setOtpValidity] = useState("10");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error("File size must be less than 100MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !recipientEmail) {
      toast.error("Please select a file and enter recipient email");
      return;
    }

    setLoading(true);
    try {
      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();
      const fileArray = new Uint8Array(fileBuffer);

      // Call encrypt-upload edge function
      const { data, error } = await supabase.functions.invoke("encrypt-upload", {
        body: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: Array.from(fileArray),
          recipientEmail,
          description,
          otpValidityMinutes: parseInt(otpValidity),
        },
      });

      if (error) throw error;

      toast.success("File uploaded and encrypted successfully! OTP sent to recipient.");
      navigate("/my-files");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SecureShare</span>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Upload Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Secure File</h1>
            <p className="text-muted-foreground">
              Your file will be encrypted with AES-256 before upload
            </p>
          </div>

          <Card className="p-8 gradient-card">
            <form onSubmit={handleUpload} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Select File (Max 100MB)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth cursor-pointer">
                  <input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="*/*"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <UploadIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      {file ? file.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Any file type accepted"}
                    </p>
                  </label>
                </div>
              </div>

              {/* Recipient Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="recipient@example.com"
                    className="pl-10"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  OTP will be sent to this email address
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What is this file about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* OTP Validity */}
              <div className="space-y-2">
                <Label htmlFor="validity">OTP Validity (Minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="validity"
                    type="number"
                    min="5"
                    max="60"
                    className="pl-10"
                    value={otpValidity}
                    onChange={(e) => setOtpValidity(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  How long the OTP will be valid (5-60 minutes)
                </p>
              </div>

              <Button
                type="submit"
                className="w-full gradient-hero"
                disabled={loading || !file}
              >
                {loading ? "Encrypting & Uploading..." : "Encrypt & Share File"}
              </Button>
            </form>
          </Card>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              🔒 <strong>Security Note:</strong> Your file will be encrypted with AES-256-GCM
              before upload. The encryption key is protected by the recipient's OTP using PBKDF2.
              We never have access to your unencrypted data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
