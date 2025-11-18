import { useQuery } from "@tanstack/react-query";
import type { HazardReport, Hotspot } from "@shared/schema";
import { MapView } from "@/components/map-view";
import { ReportFeed } from "@/components/report-feed";
import { SocialFeed } from "@/components/social-feed";
import { OfflineIndicator } from "@/components/offline-indicator";
import { useAuthStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="h-full flex flex-col">
      <OfflineIndicator />
      
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="map" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="map" data-testid="tab-map">Map</TabsTrigger>
              <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
              {user?.role !== "citizen" && (
                <TabsTrigger value="social" data-testid="tab-social">Social Media</TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="map" className="flex-1 m-0 p-0">
            <MapView />
          </TabsContent>

          <TabsContent value="reports" className="flex-1 m-0 overflow-auto">
            <div className="max-w-2xl mx-auto p-4">
              <ReportFeed />
            </div>
          </TabsContent>

          {user?.role !== "citizen" && (
            <TabsContent value="social" className="flex-1 m-0 overflow-auto">
              <div className="max-w-2xl mx-auto p-4">
                <SocialFeed />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
