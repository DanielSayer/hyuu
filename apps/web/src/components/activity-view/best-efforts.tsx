import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, TrophyIcon } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { BestEffort } from "@/utils/types/activities";

const BEST_EFFORT_TARGET_DISTANCES_METERS = [
  400, 1000, 1609.344, 5000, 10000, 21097.5, 42195,
] as const;

const DISTANCE_LABELS: Record<number, { short: string; long: string }> = {
  400: { short: "400m", long: "400 Meters" },
  1000: { short: "1km", long: "1 Kilometer" },
  1609.344: { short: "1mi", long: "1 Mile" },
  5000: { short: "5km", long: "5 Kilometers" },
  10000: { short: "10km", long: "10 Kilometers" },
  21097.5: { short: "HM", long: "Half Marathon" },
  42195: { short: "FM", long: "Full Marathon" },
};

function formatPace(distanceMeters: number, durationSeconds: number): string {
  const paceSecondsPerKm = durationSeconds / (distanceMeters / 1000);
  const m = Math.floor(paceSecondsPerKm / 60);
  const s = Math.floor(paceSecondsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

type BestEffortsProps = {
  efforts: BestEffort[];
};

export function BestEfforts({ efforts }: BestEffortsProps) {
  const effortsByDistance = new Map(
    efforts.map((e) => [e.targetDistanceMeters, e]),
  );

  const hasAnyEffort = efforts.length > 0;

  return (
    <div>
      <p className="text-muted-foreground mb-4 flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
        <TrophyIcon className="size-5 text-yellow-500" />
        Best Efforts
      </p>
      {!hasAnyEffort ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center">
          <TrendingUp className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            No best efforts recorded yet. Complete some activities to see your
            records here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {BEST_EFFORT_TARGET_DISTANCES_METERS.map((distance) => {
            const effort = effortsByDistance.get(distance);
            const label = DISTANCE_LABELS[distance];

            if (!effort) {
              return null;
            }

            return (
              <div
                key={distance}
                className="border-border flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Badge className="w-12 text-center text-xs">
                    {label.short}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {label.long}
                  </span>
                </div>

                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">
                    {formatTime(effort.durationSeconds)}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatPace(distance, effort.durationSeconds)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
