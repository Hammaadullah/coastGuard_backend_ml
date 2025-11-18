import { useEffect, useState } from "react";
import { useNetworkStore } from "@/lib/store";
import { getOfflineReports } from "@/lib/offline";
import { Alert, AlertDescription } from "./ui/alert";
import { WifiOff, Wifi, Loader2 } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, setOnline } = useNetworkStore();
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    function updateOnlineStatus() {
      setOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, [setOnline]);

  useEffect(() => {
    async function loadQueuedReports() {
      const reports = await getOfflineReports();
      setQueuedCount(reports.filter((r) => r.syncStatus === "pending").length);
    }
    loadQueuedReports();
    
    const interval = setInterval(loadQueuedReports, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline && queuedCount === 0) return null;

  return (
    <div className="p-2">
      {!isOnline ? (
        <Alert className="bg-destructive/10 border-destructive/50">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>You're offline. Reports will sync when connection is restored.</span>
            {queuedCount > 0 && (
              <span className="font-semibold">{queuedCount} queued</span>
            )}
          </AlertDescription>
        </Alert>
      ) : queuedCount > 0 ? (
        <Alert className="bg-primary/10 border-primary/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <span>Syncing offline reports...</span>
            <span className="font-semibold">{queuedCount} remaining</span>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
