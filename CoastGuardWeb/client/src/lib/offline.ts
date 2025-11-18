import localforage from "localforage";
import type { OfflineReport } from "@shared/schema";

const offlineStore = localforage.createInstance({
  name: "coastguard-offline",
  storeName: "reports",
});

export async function getOfflineReports(): Promise<OfflineReport[]> {
  const reports: OfflineReport[] = [];
  await offlineStore.iterate<OfflineReport, void>((value) => {
    reports.push(value);
  });
  return reports.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function addOfflineReport(report: OfflineReport): Promise<void> {
  await offlineStore.setItem(report.id, report);
}

export async function updateOfflineReport(id: string, updates: Partial<OfflineReport>): Promise<void> {
  const report = await offlineStore.getItem<OfflineReport>(id);
  if (report) {
    await offlineStore.setItem(id, { ...report, ...updates });
  }
}

export async function removeOfflineReport(id: string): Promise<void> {
  await offlineStore.removeItem(id);
}

export async function clearOfflineReports(): Promise<void> {
  await offlineStore.clear();
}
