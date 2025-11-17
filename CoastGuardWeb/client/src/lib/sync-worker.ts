import { getOfflineReports, removeOfflineReport, updateOfflineReport } from "./offline";
import { uploadReportWithMedia } from "./api";

let syncInterval: NodeJS.Timeout | null = null;

export async function startSyncWorker() {
  if (syncInterval) return;

  async function syncOfflineReports() {
    if (!navigator.onLine) return;

    const pendingReports = await getOfflineReports();
    const reportsToSync = pendingReports.filter((r) => r.syncStatus === "pending");

    for (const report of reportsToSync) {
      try {
        // Update status to syncing
        await updateOfflineReport(report.id, { syncStatus: "syncing" });

        // Convert data URLs back to files
        const files: File[] = [];
        if (report.mediaFiles) {
          for (const mediaFile of report.mediaFiles) {
            const response = await fetch(mediaFile.dataUrl);
            const blob = await response.blob();
            const file = new File([blob], mediaFile.name, { type: mediaFile.type });
            files.push(file);
          }
        }

        // Create form data
        const formData = new FormData();
        if (report.text) formData.append("text", report.text);
        formData.append("type_id", String(report.typeId));
        formData.append("latitude", String(report.latitude));
        formData.append("longitude", String(report.longitude));
        if (report.locationName) formData.append("location_name", report.locationName);

        files.forEach((file) => {
          formData.append("media", file);
        });

        // Upload report
        await uploadReportWithMedia(formData);

        // Remove from offline queue on success
        await removeOfflineReport(report.id);
      } catch (error) {
        console.error("Failed to sync report:", error);
        
        // Update retry count and status
        await updateOfflineReport(report.id, {
          syncStatus: "failed",
          retryCount: report.retryCount + 1,
        });

        // Reset to pending for next attempt if retry count is low
        if (report.retryCount < 3) {
          setTimeout(async () => {
            await updateOfflineReport(report.id, { syncStatus: "pending" });
          }, 5000); // Retry after 5 seconds
        }
      }
    }
  }

  // Sync immediately on start
  await syncOfflineReports();

  // Then sync every 30 seconds
  syncInterval = setInterval(syncOfflineReports, 30000);
}

export function stopSyncWorker() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
