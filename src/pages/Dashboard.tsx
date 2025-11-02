import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Upload, Files, LogOut, FileText, Download, Clock } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFiles: 0,
    activeFiles: 0,
    totalDownloads: 0,
    storageUsed: 0,
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const { data: files } = await supabase
        .from("files")
        .select("*");

      const { data: profile } = await supabase
        .from("profiles")
        .select("storage_used")
        .single();

      if (files) {
        setStats({
          totalFiles: files.length,
          activeFiles: files.filter((f) => f.file_status === "active").length,
          totalDownloads: files.reduce((sum, f) => sum + (f.access_count || 0), 0),
          storageUsed: profile?.storage_used || 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
          <div className="flex items-center gap-4">
            <Link to="/upload">
              <Button variant="ghost" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </Link>
            <Link to="/my-files">
              <Button variant="ghost" className="gap-2">
                <Files className="h-4 w-4" />
                My Files
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your secure file shares</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 gradient-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Files</p>
                <p className="text-3xl font-bold">{stats.totalFiles}</p>
              </div>
            </Card>

            <Card className="p-6 gradient-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-success" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Active Files</p>
                <p className="text-3xl font-bold">{stats.activeFiles}</p>
              </div>
            </Card>

            <Card className="p-6 gradient-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Download className="h-6 w-6 text-secondary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold">{stats.totalDownloads}</p>
              </div>
            </Card>

            <Card className="p-6 gradient-card">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Files className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold">
                  {(stats.storageUsed / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/upload">
              <Card className="p-8 gradient-hero shadow-elegant hover:shadow-glow transition-smooth cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-white/10 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Upload File</h3>
                    <p className="text-white/80">
                      Securely encrypt and share a new file
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/my-files">
              <Card className="p-8 border-2 border-primary/20 hover:border-primary/40 transition-smooth cursor-pointer h-full">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Files className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">My Files</h3>
                    <p className="text-muted-foreground">
                      View and manage your shared files
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
