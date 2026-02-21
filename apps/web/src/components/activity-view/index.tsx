import {
  formatDateTime,
  formatDistance,
  formatPace,
  formatTime,
} from "@/lib/utils";
import type { Activity } from "@/utils/types/activities";
import { Calendar } from "lucide-react";
import { RouteMap } from "../route-map";
import { Badge } from "../ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Separator } from "../ui/separator";
import { HrZoneChart } from "./hr-chart";
import { RadialBarGraph } from "./radial-bar-graph";
import { SplitsTable } from "./splits-table";
import { StatGroup } from "./stats-group";

type ActivityViewProps = {
  activity: Activity;
};

function ActivityView({ activity }: ActivityViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-bold tracking-tight">
            {activity.name ?? "Morning Run"}
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            <Calendar className="size-4" />
            {formatDateTime(activity.startDateLocal)}
          </p>
        </div>
        <Badge className="uppercase">{activity.type}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <RouteMap
            mapData={activity.mapData}
            className="h-[50vh] rounded-xl"
          />
        </div>

        <div className="border-border bg-card flex flex-col justify-between rounded-xl border p-6">
          <div className="my-auto space-y-6">
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-widest uppercase">
                Distance
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl leading-none font-black">
                  {formatDistance(activity.distance)}
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
                  value: formatTime(activity.movingTime),
                },
                {
                  label: "Avg Pace",
                  value: formatPace(activity.averageSpeed),
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
      <div className="mx-auto grid w-2/3 grid-cols-4 gap-4">
        {activity.hrLoad && (
          <RadialBarGraph value={activity.hrLoad} label="HR Load" variant={1} />
        )}
        {activity.trainingLoad && (
          <RadialBarGraph
            value={activity.trainingLoad}
            label="Training Load"
            variant={2}
          />
        )}
        {activity.intensity && (
          <RadialBarGraph
            value={activity.intensity}
            label="Intensity"
            variant={3}
          />
        )}
        {activity.maxHeartrate && activity.athleteMaxHr && (
          <HoverCard>
            <HoverCardTrigger>
              <RadialBarGraph
                value={(activity.maxHeartrate / activity.athleteMaxHr) * 100}
                label="Max HR"
                variant={3}
              />
            </HoverCardTrigger>
            <HoverCardContent side="right">
              <p className="mb-0.5 font-bold">Max Heartrate Summary</p>
              <p>
                You achieved{" "}
                {Math.round(
                  (activity.maxHeartrate / activity.athleteMaxHr) * 100,
                )}
                % of your max heartrate.
              </p>
              <div className="text-muted-foreground">
                <p>This run max {activity.maxHeartrate} bpm</p>
                <p>All time max {activity.athleteMaxHr} bpm</p>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </div>

      <Separator className="mb-12" />

      <h2 className="-mb-4 text-3xl font-bold tracking-tight">Splits</h2>
      <SplitsTable
        splits={activity.intervals
          .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))
          .map((x, i) => ({
            ...x,
            lapNumber: i + 1,
          }))}
      />

      <Separator className="mb-12" />

      <HrZoneChart
        hrZones={activity.heartRateZonesBpm}
        hrZoneTimes={activity.heartRateZoneDurationsSeconds}
      />
    </div>
  );
}

export { ActivityView };
