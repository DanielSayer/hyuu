import { Badge } from "@/components/ui/badge";
import { CalendarDays, HeartPulse, Timer } from "lucide-react";
import { memo } from "react";
import { RoutePreview } from "./route-preview";
import { formatDateTime } from "@/lib/utils";

type RoutePreview = {
  hasRoute: boolean;
  bounds: [number, number, number, number] | null;
  latlngs: [number, number][];
};

export type ActivityFeedItem = {
  id: number;
  name: string;
  distance: number;
  startDate: string | null;
  elapsedTime: number | null;
  averageHeartrate: number | null;
  routePreview: RoutePreview;
};

type ActivityCardProps = {
  activity: ActivityFeedItem;
};

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(2)} km`;
}

function formatDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds <= 0) {
    return "N/A";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

function formatAverageHeartRate(heartRate: number | null | undefined) {
  if (!heartRate || heartRate <= 0) {
    return "N/A";
  }
  return `${Math.round(heartRate)} bpm`;
}

function ActivityCardBase({ activity }: ActivityCardProps) {
  return (
    <div className="rounded-xl border bg-card/50 p-4 transition-colors hover:bg-accent/20">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium leading-tight truncate">
              {activity.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(activity.startDate)}
            </p>
          </div>
          <Badge variant="secondary">{formatDistance(activity.distance)}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border bg-background/70 px-2.5 py-2 text-muted-foreground flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5" />
            <span>Elapsed: {formatDuration(activity.elapsedTime)}</span>
          </div>
          <div className="rounded-md border bg-background/70 px-2.5 py-2 text-muted-foreground flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>
              Avg HR: {formatAverageHeartRate(activity.averageHeartrate)}
            </span>
          </div>
        </div>

        <RoutePreview routePreview={activity.routePreview} />
      </div>
    </div>
  );
}

export const ActivityCard = memo(ActivityCardBase);
