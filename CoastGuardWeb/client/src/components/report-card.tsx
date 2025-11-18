import { format } from "date-fns";
import type { HazardReport } from "@shared/schema";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { MapPin, Clock, Shield, ShieldCheck, ShieldAlert, ShieldX, CheckCircle, XCircle } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface ReportCardProps {
  report: HazardReport;
  showActions?: boolean;
  onVerify?: (reportId: number) => void;
  onDebunk?: (reportId: number) => void;
}

export function ReportCard({ report, showActions = false, onVerify, onDebunk }: ReportCardProps) {
  const { user } = useAuthStore();
  const isOfficial = user?.role === "official";

  const statusConfig = {
    officially_verified: {
      label: "Officially Verified",
      icon: ShieldCheck,
      className: "bg-status-verified/20 text-status-verified",
    },
    community_verified: {
      label: "Community Verified",
      icon: Shield,
      className: "bg-status-community/20 text-status-community",
    },
    debunked: {
      label: "Debunked",
      icon: ShieldX,
      className: "bg-status-debunked/20 text-status-debunked",
    },
    not_verified: {
      label: "Not Verified",
      icon: ShieldAlert,
      className: "bg-status-unverified/20 text-status-unverified",
    },
  };

  const config = statusConfig[report.status] || statusConfig.not_verified;
  const StatusIcon = config.icon;

  const initials = report.userName
    ? report.userName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  return (
    <Card data-testid={`report-card-${report.reportId}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{report.userName || "Anonymous"}</span>
                <span className="text-sm text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {format(new Date(report.reportTime), "MMM d, h:mm a")}
                </span>
              </div>
            </div>
          </div>
          <Badge className={`${config.className} shrink-0`} data-testid={`status-${report.reportId}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {report.description && (
          <p className="text-sm leading-relaxed">{report.description}</p>
        )}

        {report.mediaUrls && report.mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {report.mediaUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-lg bg-muted overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Report media ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {report.hazardTypeName && (
            <Badge variant="secondary" className="font-normal">
              {report.hazardTypeName}
            </Badge>
          )}
          {report.locationName && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {report.locationName}
            </span>
          )}
          {report.relevanceScore && (
            <span className="font-mono text-xs">
              Score: {report.relevanceScore.toFixed(2)}
            </span>
          )}
        </div>

        {showActions && isOfficial && report.status === "not_verified" && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              onClick={() => onVerify?.(report.reportId)}
              className="flex-1"
              data-testid={`button-verify-${report.reportId}`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDebunk?.(report.reportId)}
              className="flex-1"
              data-testid={`button-debunk-${report.reportId}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Debunk
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
