import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { SocialMediaPost } from "@shared/schema";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Clock, MapPin, Twitter, Facebook, Youtube } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
};

export function SocialFeed() {
  const { data: posts, isLoading, error } = useQuery<SocialMediaPost[]>({
    queryKey: ["/api/v1/social-posts"],
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
            <Skeleton className="h-16 w-full" />
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
          Failed to load social media posts. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No social media posts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Social Media Posts</h2>
      {posts.map((post) => {
        const PlatformIcon = platformIcons[post.platformName?.toLowerCase() || ""] || Twitter;
        const initials = post.authorName
          ? post.authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
          : "?";

        return (
          <Card key={post.postId} data-testid={`social-post-${post.postId}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{post.authorName || "Anonymous"}</span>
                    <Badge variant="outline" className="gap-1">
                      <PlatformIcon className="h-3 w-3" />
                      {post.platformName}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(post.postTime), "MMM d, h:mm a")}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{post.content}</p>

              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {post.mediaUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-lg bg-muted overflow-hidden"
                    >
                      <img
                        src={url}
                        alt={`Post media ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {post.hazardTypeName && (
                  <Badge variant="secondary" className="font-normal">
                    {post.hazardTypeName}
                  </Badge>
                )}
                {post.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {post.locationName}
                  </span>
                )}
                {post.relevanceScore && (
                  <span className="font-mono text-xs">
                    Score: {post.relevanceScore.toFixed(2)}
                  </span>
                )}
                {post.sentimentName && (
                  <Badge variant="outline" className="font-normal text-xs">
                    {post.sentimentName}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
