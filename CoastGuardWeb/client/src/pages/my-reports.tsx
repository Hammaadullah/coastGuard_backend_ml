import { useQuery } from "@tanstack/react-query";
import type { HazardReport } from "@shared/schema";
import { ReportCard } from "@/components/report-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MyReportsPage() {
  const { data: reports, isLoading, error } = useQuery<HazardReport[]>({
    queryKey: ["/api/v1/reports/mine"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold mb-4">My Reports</h1>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load your reports. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Reports</h1>
        <p className="text-muted-foreground">
          Track the status of your submitted hazard reports
        </p>
      </div>

      {reports && reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.reportId} report={report} showActions={false} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No reports yet</CardTitle>
            <CardDescription className="text-center">
              You haven't submitted any hazard reports.
              <br />
              Use the "New Report" button to create one.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
