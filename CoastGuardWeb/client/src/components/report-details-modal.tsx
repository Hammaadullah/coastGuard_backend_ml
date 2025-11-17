import { format } from "date-fns";
import type { HazardReport } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { MapPin, Clock, CheckCircle, XCircle, ShieldCheck, Shield, ShieldAlert, ShieldX } from "lucide-react";
import { useAuthStore } from "@/lib/store";

interface ReportDetailsModalProps {
  report: HazardReport;
  onClose: () => void;
  onVerify?: (reportId: number) => void;
  onDebunk?: (reportId: number) => void;
}

export function ReportDetailsModal({ report, onClose, onVerify, onDebunk }: ReportDetailsModalProps) {
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-lg">{report.userName || "Anonymous"}</span>
                <Badge className={config.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {format(new Date(report.reportTime), "MMMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>

          {report.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm leading-relaxed">{report.description}</p>
            </div>
          )}

          {report.mediaUrls && report.mediaUrls.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Media</h3>
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
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Hazard Type</div>
              <div className="font-medium">{report.hazardTypeName || "Unknown"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Location</div>
              <div className="font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {report.locationName || `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`}
              </div>
            </div>
            {report.relevanceScore && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Relevance Score</div>
                <div className="font-mono font-medium">{report.relevanceScore.toFixed(2)}</div>
              </div>
            )}
            {report.sentimentName && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Sentiment</div>
                <div className="font-medium capitalize">{report.sentimentName}</div>
              </div>
            )}
          </div>

          {isOfficial && report.status === "not_verified" && (
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  onVerify?.(report.reportId);
                  onClose();
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify Report
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  onDebunk?.(report.reportId);
                  onClose();
                }}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Debunk Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
