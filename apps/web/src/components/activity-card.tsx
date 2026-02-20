import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { trpc, TRPCResult } from "@/utils/trpc";
import { CalendarDays, HeartPulse, Timer } from "lucide-react";
import { memo } from "react";
import { RouteMap } from "./route-map";

type ActivityCardProps = {
  activity: TRPCResult<typeof trpc.activities.queryOptions>["items"][number];
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
    <div className="bg-card/50 hover:bg-accent/20 rounded-xl border p-4 transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate leading-tight font-medium">
              {activity.name}
            </p>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDateTime(activity.startDate)}
            </p>
          </div>
          <Badge variant="secondary">{formatDistance(activity.distance)}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="bg-background/70 text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-2">
            <Timer className="h-3.5 w-3.5" />
            <span>Elapsed: {formatDuration(activity.elapsedTime)}</span>
          </div>
          <div className="bg-background/70 text-muted-foreground flex items-center gap-1.5 rounded-md border px-2.5 py-2">
            <HeartPulse className="h-3.5 w-3.5" />
            <span>
              Avg HR: {formatAverageHeartRate(activity.averageHeartrate)}
            </span>
          </div>
        </div>

        <RouteMap
          mapData={activity.routePreview}
          disabled
          allowCustomLayers={false}
          showLayerToggle={false}
        />
      </div>
    </div>
  );
}

export const ActivityCard = memo(ActivityCardBase);
