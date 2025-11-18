import { useQuery, useMutation } from "@tanstack/react-query";
import type { HazardReport } from "@shared/schema";
import { ReportCard } from "./report-card";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function ReportFeed() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isOfficial = user?.role === "official";

  const { data: reports, isLoading, error } = useQuery<HazardReport[]>({
    queryKey: ["/api/v1/reports"],
    refetchInterval: 30000,
  });

  const verifyMutation = useMutation({
    mutationFn: (reportId: number) =>
      apiRequest("PATCH", `/v1/verify-user-report/${reportId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/reports"] });
      toast({ title: "Report verified", description: "The report has been officially verified" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Could not verify the report. Please try again.",
      });
    },
  });

  const debunkMutation = useMutation({
    mutationFn: (reportId: number) =>
      apiRequest("PATCH", `/v1/debunk-user-report/${reportId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/reports"] });
      toast({ title: "Report debunked", description: "The report has been marked as debunked" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Debunk failed",
        description: "Could not debunk the report. Please try again.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load reports. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No reports available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
      {reports.map((report) => (
        <ReportCard
          key={report.reportId}
          report={report}
          showActions={isOfficial}
          onVerify={(id) => verifyMutation.mutate(id)}
          onDebunk={(id) => debunkMutation.mutate(id)}
        />
      ))}
    </div>
  );
}
