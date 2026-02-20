import type { trpc, TRPCResult } from "@/utils/trpc";
import { RouteMap } from "../route-map";
import { Calendar } from "lucide-react";
import {
  formatDateTime,
  formatPace,
  formatTime,
  formatDistance,
} from "@/lib/utils";
import { StatGroup } from "./stats-group";
import { Separator } from "../ui/separator";

type ActivityViewProps = {
  activity: TRPCResult<typeof trpc.activity.queryOptions>;
};

function ActivityView({ activity }: ActivityViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {activity.name ?? "Morning Run"}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="size-4" />
            {formatDateTime(activity.startDateLocal)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-8">
        <div className="col-span-3">
          <RouteMap
            mapData={activity.mapData}
            className="h-[50vh] rounded-xl"
          />
        </div>

        <div className="border-border bg-card col-span-2 flex flex-col justify-between rounded-xl border p-6">
          <div className="space-y-6">
            {/* Primary */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">
                Distance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl leading-none font-black">
                  {activity.distance ? formatDistance(activity.distance) : "—"}
                </span>
                <span className="text-muted-foreground text-xl font-medium">
                  km
                </span>
              </div>
            </div>

            <Separator />

            <StatGroup
              items={[
                {
                  label: "Time",
                  value: activity.movingTime
                    ? formatTime(activity.movingTime)
                    : "—",
                },
                {
                  label: "Avg Pace",
                  value: activity.averageSpeed
                    ? formatPace(activity.averageSpeed)
                    : "—",
                  sub: "/km",
                },
                {
                  label: "Avg HR",
                  value: activity.averageHeartrate
                    ? `${Math.round(activity.averageHeartrate)}`
                    : "—",
                  sub: "bpm",
                },
              ]}
            />

            <Separator />

            <StatGroup
              items={[
                {
                  label: "Elevation",
                  value: activity.totalElevationGain
                    ? `${Math.round(activity.totalElevationGain)}m`
                    : "—",
                },
                {
                  label: "Cadence",
                  value: activity.averageCadence
                    ? `${Math.round(activity.averageCadence)}`
                    : "—",
                  sub: "spm",
                },
                {
                  label: "Calories",
                  value: activity.calories
                    ? `${Math.round(activity.calories)}`
                    : "—",
                  sub: "kcal",
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { ActivityView };
