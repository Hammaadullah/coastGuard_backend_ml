import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Hotspot, HazardReport, SocialMediaPost } from "@shared/schema";
import { useMapLayersStore } from "@/lib/store";
import { MapLayerToggle } from "./map-layer-toggle";
import { ReportDetailsModal } from "./report-details-modal";
import { Badge } from "./ui/badge";
import { MapPin, Radio, MessageSquare, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };
const MAP_WIDTH = 1000;
const MAP_HEIGHT = 800;

function latLngToPixel(lat: number, lng: number, zoom: number, center: { lat: number; lng: number }) {
  const scale = Math.pow(2, zoom);
  const worldWidth = MAP_WIDTH * scale;
  const worldHeight = MAP_HEIGHT * scale;
  
  const x = ((lng + 180) / 360) * worldWidth - ((center.lng + 180) / 360) * worldWidth + MAP_WIDTH / 2;
  const y = ((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2) * worldHeight -
    ((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2) * worldHeight + MAP_HEIGHT / 2;
  
  return { x, y };
}

export function MapView() {
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const [zoom, setZoom] = useState(11);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  
  const { showHotspots, showReports, showSocialPosts } = useMapLayersStore();

  const { data: hotspots } = useQuery<Hotspot[]>({
    queryKey: ["/api/hotspots"],
    refetchInterval: 60000,
    enabled: showHotspots,
  });

  const { data: reports } = useQuery<HazardReport[]>({
    queryKey: ["/api/v1/reports"],
    refetchInterval: 30000,
    enabled: showReports,
  });

  const { data: socialPosts } = useQuery<SocialMediaPost[]>({
    queryKey: ["/api/v1/social-posts"],
    enabled: showSocialPosts,
  });

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 1, 18));
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 1, 3));
  }

  function handleReset() {
    setZoom(11);
    setCenter(DEFAULT_CENTER);
  }

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    const scale = Math.pow(2, zoom);
    const latShift = -dy / (MAP_HEIGHT * scale) * 180;
    const lngShift = -dx / (MAP_WIDTH * scale) * 360;
    
    setCenter((c) => ({
      lat: Math.max(-85, Math.min(85, c.lat + latShift)),
      lng: ((c.lng + lngShift + 180) % 360) - 180,
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-blue-950/30 to-slate-900/30 overflow-hidden">
      <div
        ref={mapRef}
        className={`relative w-full h-full ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-primary/20" />
          ))}
        </div>

        {showHotspots && hotspots?.map((hotspot) => {
          const pos = latLngToPixel(hotspot.location.latitude, hotspot.location.longitude, zoom, center);
          const radius = hotspot.radiusKm * 5 * Math.pow(2, zoom - 11);
          
          if (pos.x < -100 || pos.x > MAP_WIDTH + 100 || pos.y < -100 || pos.y > MAP_HEIGHT + 100) return null;
          
          return (
            <div
              key={`hotspot-${hotspot.hotspotId}`}
              className="absolute pointer-events-none"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="rounded-full bg-destructive/20 border-2 border-destructive animate-pulse-slow"
                style={{
                  width: `${radius}px`,
                  height: `${radius}px`,
                }}
              />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <Radio className="h-4 w-4 text-destructive" />
              </div>
            </div>
          );
        })}

        {showReports && reports?.map((report) => {
          const pos = latLngToPixel(report.location.latitude, report.location.longitude, zoom, center);
          
          if (pos.x < -50 || pos.x > MAP_WIDTH + 50 || pos.y < -50 || pos.y > MAP_HEIGHT + 50) return null;
          
          return (
            <div
              key={`report-${report.reportId}`}
              className="absolute cursor-pointer hover-elevate active-elevate-2 rounded-full"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: "translate(-50%, -100%)",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReport(report);
              }}
            >
              <div
                className={`h-6 w-6 rounded-full border-2 border-background flex items-center justify-center ${
                  report.status === "officially_verified" ? "bg-status-verified" :
                  report.status === "community_verified" ? "bg-status-community" :
                  report.status === "debunked" ? "bg-status-debunked" :
                  "bg-status-unverified"
                }`}
              >
                <MapPin className="h-3 w-3 text-white" />
              </div>
            </div>
          );
        })}

        {showSocialPosts && socialPosts?.filter((p) => p.location).map((post) => {
          const pos = latLngToPixel(post.location!.latitude, post.location!.longitude, zoom, center);
          
          if (pos.x < -50 || pos.x > MAP_WIDTH + 50 || pos.y < -50 || pos.y > MAP_HEIGHT + 50) return null;
          
          return (
            <div
              key={`social-${post.postId}`}
              className="absolute"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="h-5 w-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                <MessageSquare className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-card/95 backdrop-blur-sm p-2 rounded-lg border">
        <Button size="icon" variant="ghost" onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleReset} title="Reset view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <MapLayerToggle />

      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
