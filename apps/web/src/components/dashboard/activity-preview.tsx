import { trpc, type TRPCResult } from "@/utils/trpc";
import { formatDateTime } from "@hyuu/utils/dates";
import { formatSecondsToHms } from "@hyuu/utils/time";
import { Link } from "@tanstack/react-router";
import { ClockIcon, HeartPulseIcon, TimerIcon } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";

type RecentActivity = TRPCResult<
  typeof trpc.recentActivities.queryOptions
>[number];

function toSvgPath(
  latlngs: Array<number[] | null> | null | undefined,
  width = 320,
  height = 88,
) {
  const points = (latlngs ?? [])
    .filter((point): point is number[] => !!point && point.length >= 2)
    .map(([lat, lng]) => ({ lat, lng }));

  if (points.length < 2) return null;

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  const latRange = maxLat - minLat || 0.000001;
  const lngRange = maxLng - minLng || 0.000001;
  const pad = 6;
  const drawWidth = width - pad * 2;
  const drawHeight = height - pad * 2;
  const scale = Math.min(drawWidth / lngRange, drawHeight / latRange);
  const offsetX = pad + (drawWidth - lngRange * scale) / 2;
  const offsetY = pad + (drawHeight - latRange * scale) / 2;

  return points
    .map((point, idx) => {
      const x = (point.lng - minLng) * scale + offsetX;
      const y = drawHeight - (point.lat - minLat) * scale + offsetY;
      return `${idx === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatAverageHeartRate(value: number | null | undefined) {
  if (!value || value <= 0) return "N/A";
  return `${Math.round(value)} bpm`;
}

function ActivityPreview({ activities }: { activities: RecentActivity[] }) {
  if (activities.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm font-medium">Recent Activities</p>
        <p className="text-muted-foreground mt-2 text-sm">
          No activities found.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {activities.map((activity) => {
        const path = toSvgPath(activity.routePreview?.latlngs);

        return (
          <Link
            to="/activity/$activityId"
            params={{ activityId: activity.id }}
            key={activity.id}
          >
            <Card className="hover:bg-accent/20 flex-row items-center justify-between rounded-lg border p-3">
              <CardHeader className="w-2/3 flex-1 px-3">
                <CardTitle>{activity.name}</CardTitle>
                <CardDescription className="text-muted-foreground flex w-full items-center justify-between gap-1 text-xs">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {formatDateTime(activity.startDate)}
                  </span>

                  <Separator orientation="vertical" className="h-3.5" />

                  <span className="flex items-center gap-1">
                    <TimerIcon className="size-3.5" />
                    {formatSecondsToHms(activity.elapsedTime)}
                  </span>

                  <Separator orientation="vertical" className="h-3.5" />

                  <span className="flex items-center gap-1">
                    <HeartPulseIcon className="size-3.5" />
                    {formatAverageHeartRate(activity.averageHeartrate)}
                  </span>
                </CardDescription>
              </CardHeader>

              <div className="bg-muted/30 h-20 w-1/3 overflow-hidden rounded-md border">
                {path ? (
                  <svg
                    viewBox="0 0 320 88"
                    className="h-20 w-full"
                    role="img"
                    aria-label={`Map preview for ${activity.name}`}
                  >
                    <path
                      d={path}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <div className="text-muted-foreground flex h-20 items-center justify-center text-xs">
                    Map unavailable
                  </div>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ActivityPreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={`activity-preview-skeleton-${index}`} className="p-3">
          <Skeleton className="h-21 w-full" />
        </Card>
      ))}
    </div>
  );
}

export { ActivityPreview, ActivityPreviewSkeleton };
