import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Upload,
  Files,
  LogOut,
  Activity,
  Download,
  CheckCircle2,
  XCircle,
  FileUp,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface LogRow {
  id: string;
  timestamp: string | null;
  created_at: string | null;
  access_type: string;
  access_status: string;
  failure_reason: string | null;
  file_id: string | null;
  files: { original_filename: string } | null;
}

const PAGE_SIZE = 10;

const ActivityLog = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchLogs();
      if (isMounted) setLoading(false);
    };
    init();

    const interval = setInterval(() => {
      fetchLogs();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("access_logs")
        .select("id, timestamp, created_at, access_type, access_status, failure_reason, file_id, files(original_filename)")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as unknown as LogRow[]) || []);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load activity logs");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const stats = useMemo(() => {
    const totalEvents = logs.length;
    const successfulDownloads = logs.filter(
      (l) => l.access_type === "download" && l.access_status === "success"
    ).length;
    const failedAttempts = logs.filter((l) => l.access_status === "failure").length;
    const filesUploaded = logs.filter((l) => l.access_type === "upload").length;
    return { totalEvents, successfulDownloads, failedAttempts, filesUploaded };
  }, [logs]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      counts[l.access_type] = (counts[l.access_type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  const CHART_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--success))",
    "hsl(var(--destructive))",
  ];

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (typeFilter !== "all" && l.access_type !== typeFilter) return false;
      if (statusFilter !== "all" && l.access_status !== statusFilter) return false;
      if (search) {
        const name = l.files?.original_filename?.toLowerCase() || "";
        if (!name.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
            <Link to="/activity-log">
              <Button variant="ghost" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity
              </Button>
            </Link>
            <Button variant="ghost" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Activity Log</h1>
            <p className="text-muted-foreground">
              Live audit trail of all file access events (auto-refreshes every 30s)
            </p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 gradient-card">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-3xl font-bold">{stats.totalEvents}</p>
            </Card>
            <Card className="p-6 gradient-card">
              <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Successful Downloads</p>
              <p className="text-3xl font-bold">{stats.successfulDownloads}</p>
            </Card>
            <Card className="p-6 gradient-card">
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm text-muted-foreground">Failed Attempts</p>
              <p className="text-3xl font-bold">{stats.failedAttempts}</p>
            </Card>
            <Card className="p-6 gradient-card">
              <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <FileUp className="h-6 w-6 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Files Uploaded</p>
              <p className="text-3xl font-bold">{stats.filesUploaded}</p>
            </Card>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card className="p-6 gradient-card">
              <h3 className="text-xl font-semibold mb-4">Event Distribution</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {chartData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card className="p-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <Input
                placeholder="Search by file name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="upload">Upload</SelectItem>
                  <SelectItem value="download">Download</SelectItem>
                  <SelectItem value="otp_verify">OTP Verify</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failure">Failure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No activity yet</p>
                <p className="text-sm text-muted-foreground">
                  Events will appear here once files are uploaded or accessed.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Failure Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((l) => {
                        const ts = l.timestamp || l.created_at;
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {ts ? new Date(ts).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {l.files?.original_filename || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {l.access_type.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {l.access_status === "success" ? (
                                <Badge className="bg-success text-success-foreground hover:bg-success/90">
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="destructive">Failure</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {l.failure_reason || "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} • {filtered.length} events
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
