import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createReportSchema, type CreateReportInput, type OfflineReport } from "@shared/schema";
import { useNetworkStore } from "@/lib/store";
import { uploadReportWithMedia } from "@/lib/api";
import { addOfflineReport } from "@/lib/offline";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MapPin, Upload, Loader2, WifiOff, Image as ImageIcon } from "lucide-react";

interface NewReportFormProps {
  onSuccess?: () => void;
}

export function NewReportForm({ onSuccess }: NewReportFormProps) {
  const { toast } = useToast();
  const { isOnline } = useNetworkStore();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<Omit<CreateReportInput, "media">>({
    resolver: zodResolver(createReportSchema.omit({ media: true })),
    defaultValues: {
      text: "",
      typeId: 1,
      latitude: 0,
      longitude: 0,
      locationName: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateReportInput) => {
      const formData = new FormData();
      if (data.text) formData.append("text", data.text);
      formData.append("type_id", String(data.typeId));
      formData.append("latitude", String(data.latitude));
      formData.append("longitude", String(data.longitude));
      if (data.locationName) formData.append("location_name", data.locationName);
      
      if (data.media) {
        data.media.forEach((file) => {
          formData.append("media", file);
        });
      }

      return uploadReportWithMedia(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/v1/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/reports/mine"] });
      toast({ title: "Success", description: "Report submitted successfully" });
      form.reset();
      setSelectedFiles([]);
      setLocation(null);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message || "Could not submit report",
      });
    },
  });

  async function getCurrentLocation() {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(loc);
        form.setValue("latitude", loc.latitude);
        form.setValue("longitude", loc.longitude);
        setIsGettingLocation(false);
        toast({ title: "Location captured", description: "GPS coordinates obtained" });
      },
      (error) => {
        setIsGettingLocation(false);
        toast({
          variant: "destructive",
          title: "Location error",
          description: "Could not get your location. Please enter manually.",
        });
      }
    );
  }

  async function onSubmit(data: Omit<CreateReportInput, "media">) {
    if (!isOnline) {
      const offlineReport: OfflineReport = {
        id: crypto.randomUUID(),
        text: data.text,
        typeId: data.typeId,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        mediaFiles: await Promise.all(
          selectedFiles.map(async (file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: await fileToDataUrl(file),
          }))
        ),
        createdAt: new Date().toISOString(),
        syncStatus: "pending",
        retryCount: 0,
      };

      await addOfflineReport(offlineReport);
      toast({
        title: "Queued for sync",
        description: "Report saved offline and will sync when connection is restored",
      });
      form.reset();
      setSelectedFiles([]);
      setLocation(null);
      onSuccess?.();
      return;
    }

    createMutation.mutate({
      ...data,
      media: selectedFiles.length > 0 ? selectedFiles : undefined,
    });
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 4));
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Hazard Report</CardTitle>
        <CardDescription>
          {isOnline
            ? "Report coastal hazards in real-time"
            : "You're offline - reports will sync when connection is restored"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="shrink-0"
                data-testid="button-get-location"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                {location ? "Update" : "Get Location"}
              </Button>
              {location && (
                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              )}
            </div>
            <Input
              id="location-name"
              placeholder="Optional: Location name (e.g., North Beach)"
              data-testid="input-location-name"
              {...form.register("locationName")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hazard-type">Hazard Type</Label>
            <Select
              value={String(form.watch("typeId"))}
              onValueChange={(value) => form.setValue("typeId", parseInt(value))}
            >
              <SelectTrigger id="hazard-type" data-testid="select-hazard-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tsunami</SelectItem>
                <SelectItem value="2">Storm Surge</SelectItem>
                <SelectItem value="3">High Waves</SelectItem>
                <SelectItem value="4">Coastal Flooding</SelectItem>
                <SelectItem value="5">Oil Spill</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you observed..."
              className="min-h-32 resize-none"
              data-testid="textarea-description"
              {...form.register("text")}
            />
            {form.formState.errors.text && (
              <p className="text-sm text-destructive">{form.formState.errors.text.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Photos/Videos (optional, max 4)</Label>
            <div className="space-y-2">
              <Input
                id="media"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileChange}
                disabled={selectedFiles.length >= 4}
                className="cursor-pointer"
                data-testid="input-media"
              />
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-lg bg-muted overflow-hidden group"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFile(idx)}
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="absolute bottom-2 left-2 text-xs text-white truncate max-w-full px-2">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || !location}
            data-testid="button-submit-report"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isOnline ? (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Report
              </>
            ) : (
              <>
                <WifiOff className="mr-2 h-4 w-4" />
                Queue for Sync
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
