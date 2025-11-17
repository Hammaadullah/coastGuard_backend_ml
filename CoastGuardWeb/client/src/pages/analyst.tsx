import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, MapPin, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HazardReport } from "@shared/schema";

export default function AnalystPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hazardType, setHazardType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: reports, isLoading } = useQuery<HazardReport[]>({
    queryKey: ["/api/v1/reports", { startDate, endDate, hazardType, status }],
    enabled: false, // Only fetch when user clicks "Query"
  });

  function handleExportCSV() {
    if (!reports || reports.length === 0) {
      toast({
        title: "No data to export",
        description: "Run a query first to generate data.",
      });
      return;
    }

    // Create CSV content
    const headers = ["Report ID", "Date", "Type", "Location", "Status", "Relevance Score"];
    const rows = reports.map((r) => [
      r.reportId,
      new Date(r.reportTime).toLocaleDateString(),
      r.hazardTypeName || "Unknown",
      r.locationName || `${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}`,
      r.status,
      r.relevanceScore?.toFixed(2) || "N/A",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coastguard-reports-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Downloaded ${reports.length} reports as CSV`,
    });
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Data Analysis Dashboard</h1>
        <p className="text-muted-foreground">
          Query historical data and export reports for analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Query Builder
          </CardTitle>
          <CardDescription>
            Filter and analyze historical hazard reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">
                <Calendar className="h-4 w-4 inline mr-2" />
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">
                <Calendar className="h-4 w-4 inline mr-2" />
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hazard-type">Hazard Type</Label>
              <Select value={hazardType} onValueChange={setHazardType}>
                <SelectTrigger id="hazard-type" data-testid="select-hazard-type">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="tsunami">Tsunami</SelectItem>
                  <SelectItem value="surge">Storm Surge</SelectItem>
                  <SelectItem value="waves">High Waves</SelectItem>
                  <SelectItem value="flooding">Coastal Flooding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                  <SelectItem value="community_verified">Community Verified</SelectItem>
                  <SelectItem value="officially_verified">Officially Verified</SelectItem>
                  <SelectItem value="debunked">Debunked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" data-testid="button-query">
              <MapPin className="h-4 w-4 mr-2" />
              Run Query
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={!reports || reports.length === 0}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {reports && reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Query Results</CardTitle>
            <CardDescription>{reports.length} reports found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-3 text-left font-medium">ID</th>
                      <th className="p-3 text-left font-medium">Date</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Location</th>
                      <th className="p-3 text-left font-medium">Status</th>
                      <th className="p-3 text-left font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.reportId} className="border-b hover-elevate">
                        <td className="p-3 font-mono">{report.reportId}</td>
                        <td className="p-3">{new Date(report.reportTime).toLocaleDateString()}</td>
                        <td className="p-3">{report.hazardTypeName || "Unknown"}</td>
                        <td className="p-3 text-muted-foreground">
                          {report.locationName || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            report.status === "officially_verified" ? "bg-status-verified/20 text-status-verified" :
                            report.status === "community_verified" ? "bg-status-community/20 text-status-community" :
                            report.status === "debunked" ? "bg-status-debunked/20 text-status-debunked" :
                            "bg-status-unverified/20 text-status-unverified"
                          }`}>
                            {report.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 font-mono">{report.relevanceScore?.toFixed(2) || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
