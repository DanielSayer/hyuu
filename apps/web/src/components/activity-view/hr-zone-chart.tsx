import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ZONE_CONFIG = [
  { zone: "Z1", name: "Recovery", color: "bg-gray-400", pctRange: "0 - 84%" },
  {
    zone: "Z2",
    name: "Aerobic",
    color: "border-blue-500 dark:bg-blue-300 bg-blue-500",
    pctRange: "85% - 89%",
  },
  {
    zone: "Z3",
    name: "Tempo",
    color: "border-green-500 dark:bg-green-300 bg-green-500",
    pctRange: "90% - 94%",
  },
  {
    zone: "Z4",
    name: "SubThreshold",
    color: "border-yellow-400 dark:bg-yellow-200 bg-yellow-500",
    pctRange: "95% - 99%",
  },
  {
    zone: "Z5",
    name: "SuperThreshold",
    color: "border-orange-500 dark:bg-orange-300 bg-orange-500",
    pctRange: "100% - 102%",
  },
  {
    zone: "Z6",
    name: "Aerobic Capacity",
    color: "border-red-500 dark:bg-red-300 bg-red-500",
    pctRange: "103% - 105%",
  },
  {
    zone: "Z7",
    name: "Anaerobic",
    color: "border-purple-600 dark:bg-purple-400 bg-purple-500",
    pctRange: "106%+",
  },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) {
    return `${m}m${s > 0 ? ` ${s}s` : ""}`;
  }
  return `${s}s`;
}

interface HrZoneChartProps {
  hrZones: number[] | null;
  hrZoneTimes: number[] | null;
}

export function HrZoneChart({ hrZones, hrZoneTimes }: HrZoneChartProps) {
  if (!hrZones || !hrZoneTimes) {
    return null;
  }

  const totalTime = hrZoneTimes.reduce((a, b) => a + b, 0);
  const maxTime = Math.max(...hrZoneTimes);

  const getHrRange = (index: number): string => {
    if (index === 0) return `0 - ${hrZones[0]}`;
    return `${hrZones[index - 1] + 1} - ${hrZones[index]}`;
  };

  return (
    <div>
      <h2 className="mb-4 text-3xl font-bold tracking-tight">
        Heart Rate Zones
      </h2>
      <div className="space-y-2">
        {ZONE_CONFIG.map((config, i) => {
          const time = hrZoneTimes[i] ?? 0;
          const pct = totalTime > 0 ? (time / totalTime) * 100 : 0;
          const barWidth = maxTime > 0 ? (time / maxTime) * 100 : 0;

          return (
            <div
              key={config.zone}
              className="grid items-center gap-2 text-base"
              style={{
                gridTemplateColumns: "28px 150px 100px 70px 1fr 70px 70px",
              }}
            >
              <span className="text-muted-foreground font-semibold">
                {config.zone}
              </span>
              <span className="truncate font-medium">{config.name}</span>
              <span className="text-muted-foreground">{config.pctRange}</span>
              <span className="text-muted-foreground">{getHrRange(i)}</span>
              <div className="bg-muted h-4 w-full overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full rounded-full border-2 transition-all duration-700 ease-out",
                    config.color,
                  )}
                  style={{
                    width: `${barWidth}%`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <span className="text-right font-medium">{formatTime(time)}</span>
              <span className="text-muted-foreground text-right font-medium">
                {pct.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
