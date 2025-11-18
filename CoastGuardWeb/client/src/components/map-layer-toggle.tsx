import { useMapLayersStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Radio, MapPin, MessageSquare, Layers } from "lucide-react";

export function MapLayerToggle() {
  const { showHotspots, showReports, showSocialPosts, toggleHotspots, toggleReports, toggleSocialPosts } = useMapLayersStore();

  return (
    <Card className="absolute top-4 right-4 z-10 bg-card/95 backdrop-blur-sm border-card-border min-w-[240px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Map Layers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="layer-hotspots" className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm">Hotspots</span>
          </Label>
          <Switch
            id="layer-hotspots"
            checked={showHotspots}
            onCheckedChange={toggleHotspots}
            data-testid="toggle-hotspots"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="layer-reports" className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 rounded-full bg-status-verified" />
            <span className="text-sm">Reports</span>
          </Label>
          <Switch
            id="layer-reports"
            checked={showReports}
            onCheckedChange={toggleReports}
            data-testid="toggle-reports"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="layer-social" className="flex items-center gap-2 cursor-pointer">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm">Social Posts</span>
          </Label>
          <Switch
            id="layer-social"
            checked={showSocialPosts}
            onCheckedChange={toggleSocialPosts}
            data-testid="toggle-social"
          />
        </div>
      </CardContent>
    </Card>
  );
}
