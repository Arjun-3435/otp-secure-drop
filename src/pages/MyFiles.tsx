import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft, FileText, Download, Clock, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface FileRecord {
  id: string;
  original_filename: string;
  file_size: number;
  recipient_email: string;
  file_status: string;
  upload_timestamp: string;
  otp_expires_at: string;
  access_count: number;
  max_access_attempts: number;
}

const MyFiles = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    checkAuth();
    loadFiles();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadFiles = async (pageNum = 0) => {
    try {
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .neq("file_status", "deleted")
        .order("created_at", { ascending: false })
        .range(from, to)
        .limit(PAGE_SIZE);

      if (error) throw error;
      
      setHasMore((data || []).length === PAGE_SIZE);
      
      if (pageNum === 0) {
        setFiles(data || []);
      } else {
        setFiles(prev => [...prev, ...(data || [])]);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFiles(nextPage);
  };

  const copyAccessLink = (fileId: string) => {
    const link = `${window.location.origin}/access/${fileId}`;
    navigator.clipboard.writeText(link);
    toast.success("Access link copied to clipboard");
  };

  const handleDelete = async (fileId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      const { error } = await supabase
        .from("files")
        .update({ file_status: "deleted" })
        .eq("id", fileId);

      if (error) throw error;
      toast.success("File deleted successfully");
      loadFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "expired":
        return "bg-muted text-muted-foreground border-border";
      case "revoked":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "deleted":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading files...</div>
      </div>
    );
  }

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

      {/* Files List */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Files</h1>
            <p className="text-muted-foreground">
              Manage your securely shared files
            </p>
          </div>

          {files.length === 0 ? (
            <Card className="p-12 text-center gradient-card">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-6">
                Start by uploading your first secure file
              </p>
              <Link to="/upload">
                <Button className="gradient-hero">Upload File</Button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <Card key={file.id} className="p-6 gradient-card">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold mb-1 truncate">
                          {file.original_filename}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          <span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                          <span>To: {file.recipient_email}</span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(file.upload_timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={getStatusColor(file.file_status)}>
                            {file.file_status}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Download className="h-3 w-3" />
                            {file.access_count}/{file.max_access_attempts}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(file.otp_expires_at) > new Date()
                              ? "OTP Valid"
                              : "OTP Expired"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAccessLink(file.id)}
                        className="gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.original_filename)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {hasMore && files.length > 0 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    className="gap-2"
                  >
                    Load More Files
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFiles;
