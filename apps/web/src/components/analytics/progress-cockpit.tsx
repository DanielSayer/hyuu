import { Card } from "@/components/ui/card";
import { DISTANCE_CONFIG, PR_KEY_TO_DISTANCE_MAP } from "@/lib/best-efforts";
import { cn } from "@/lib/utils";
import { formatPace } from "@hyuu/api/utils";
import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToHms } from "@hyuu/utils/time";
import { format } from "date-fns";
import {
  Calendar,
  Footprints,
  MapPin,
  MapPinIcon,
  TrendingUp,
  TrophyIcon,
} from "lucide-react";
import { Medal } from "../medal";
import { CumulativeDistanceChart } from "./cumulative-distance-chart";
import { MonthlyDistanceChart } from "./monthly-distance-chart";
import { MonthlyPaceChart } from "./monthly-pace-chart";

type PersonalRecord = {
  valueSeconds: number | null;
  activityStartDate: string | Date | null;
};

type AnalyticsData = {
  kpis: {
    distanceThisYear: number;
    timeRunThisYear: number;
    runsThisYear: number;
    distanceThisMonth: number;
    timeRunThisMonth: number;
    runsThisMonth: number;
    avgMonthlyDistance: number;
  };
  monthly: {
    monthStart: string;
    distanceM: number;
    elapsedS: number;
    avgPaceSecPerKm: number | null;
    runCount: number;
  }[];
  personalRecords: {
    fastest1km: PersonalRecord | null;
    fastest5k: PersonalRecord | null;
    fastest10k: PersonalRecord | null;
    fastestHalf: PersonalRecord | null;
    fastestFull: PersonalRecord | null;
    longestRunEver: {
      valueDistanceM: number | null;
      activityStartDate: string | Date | null;
    } | null;
  };
};

type ProgressCockpitProps = {
  data: AnalyticsData;
};

function toDistance(meters: number) {
  if (meters <= 0) {
    return "0.00 km";
  }
  return formatDistanceToKm(meters);
}

function toDuration(seconds: number) {
  if (seconds <= 0) {
    return "0:00";
  }
  return formatSecondsToHms(seconds);
}

function toDateLabel(date: string | Date | null | undefined) {
  if (!date) {
    return "No date";
  }
  return format(new Date(date), "MMM d, yyyy");
}

const PR_SECTIONS = [
  { label: "1K", key: "fastest1km" },
  { label: "5K", key: "fastest5k" },
  { label: "10K", key: "fastest10k" },
  { label: "Half", key: "fastestHalf" },
  { label: "Full", key: "fastestFull" },
] as const;

function ProgressCockpit({ data }: ProgressCockpitProps) {
  const monthlyChartData = data.monthly.map((row) => ({
    month: format(new Date(row.monthStart), "MMM"),
    distanceKm: Number((row.distanceM / 1000).toFixed(2)),
    paceSecPerKm: row.avgPaceSecPerKm,
    cumulativeKm: 0,
    hasData: row.runCount > 0,
  }));

  let runningKm = 0;
  for (const month of monthlyChartData) {
    runningKm += month.distanceKm;
    month.cumulativeKm = Number(runningKm.toFixed(2));
  }

  // Pace chart: only months that have runs (no misleading zero-line)
  const paceChartData = monthlyChartData.filter(
    (m) => m.hasData && m.paceSecPerKm !== null,
  );

  // Cumulative chart: truncate after the last month with activity
  const lastActiveIndex = monthlyChartData.findLastIndex((m) => m.hasData);
  const cumulativeChartData = monthlyChartData.slice(0, lastActiveIndex + 1);

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden border-emerald-500/20 bg-emerald-500/5 p-5 transition-colors hover:border-emerald-500/40">
          <div className="absolute -top-3 -right-3 rounded-full bg-emerald-500/10 p-5 transition-transform group-hover:scale-110">
            <MapPin className="h-5 w-5 text-emerald-400/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_var(--color-emerald-400)]" />
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              This Year
            </p>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            {toDistance(data.kpis.distanceThisYear)}
          </p>
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400">
              {toDuration(data.kpis.timeRunThisYear)}
            </span>
            <span>total time</span>
          </div>
        </Card>

        <Card className="group relative overflow-hidden border-sky-500/20 bg-sky-500/5 p-5 transition-colors hover:border-sky-500/40">
          <div className="absolute -top-3 -right-3 rounded-full bg-sky-500/10 p-5 transition-transform group-hover:scale-110">
            <Calendar className="h-5 w-5 text-sky-400/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_6px_var(--color-sky-400)]" />
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              This Month
            </p>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            {toDistance(data.kpis.distanceThisMonth)}
          </p>
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-block rounded bg-sky-500/10 px-1.5 py-0.5 text-sky-400">
              {toDuration(data.kpis.timeRunThisMonth)}
            </span>
            <span>total time</span>
          </div>
        </Card>

        <Card className="group relative overflow-hidden border-violet-500/20 bg-violet-500/5 p-5 transition-colors hover:border-violet-500/40">
          <div className="absolute -top-3 -right-3 rounded-full bg-violet-500/10 p-5 transition-transform group-hover:scale-110">
            <Footprints className="h-5 w-5 text-violet-400/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_6px_var(--color-violet-400)]" />
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Runs This Year
            </p>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            {data.kpis.runsThisYear}
          </p>
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-block rounded bg-violet-500/10 px-1.5 py-0.5 text-violet-400">
              {data.kpis.runsThisMonth}
            </span>
            <span>this month</span>
          </div>
        </Card>

        <Card className="group relative overflow-hidden border-amber-500/20 bg-amber-500/5 p-5 transition-colors hover:border-amber-500/40">
          <div className="absolute -top-3 -right-3 rounded-full bg-amber-500/10 p-5 transition-transform group-hover:scale-110">
            <TrendingUp className="h-5 w-5 text-amber-400/50" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_var(--color-amber-400)]" />
            <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
              Avg Monthly Distance
            </p>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight">
            {toDistance(data.kpis.avgMonthlyDistance)}
          </p>
          <div className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <span className="inline-block rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-400">
              12 month
            </span>
            <span>average</span>
          </div>
        </Card>
      </div>

      {/* Personal Records */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-amber-400" />
          <h2 className="text-xl font-semibold tracking-tight">
            Personal Records
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto]">
          {/* Distance PRs */}
          <Card className="relative overflow-hidden p-6">
            <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:grid-cols-5">
              {PR_SECTIONS.map((section) => {
                const record = data.personalRecords[section.key];
                const hasRecord = !!record?.valueSeconds;
                const config =
                  DISTANCE_CONFIG[PR_KEY_TO_DISTANCE_MAP[section.key]];

                return (
                  <div
                    key={section.key}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={cn(!hasRecord && "opacity-30 grayscale")}>
                      <Medal
                        label={config.short}
                        color={config.color}
                        ring={config.ring}
                        glow={hasRecord ? config.glow : ""}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "font-mono text-sm leading-tight font-semibold tabular-nums",
                          !hasRecord && "text-muted-foreground",
                        )}
                      >
                        {hasRecord
                          ? formatSecondsToHms(record.valueSeconds)
                          : "—"}
                      </span>
                      {hasRecord && (
                        <span className="text-muted-foreground font-mono text-xs tabular-nums">
                          {formatPace(
                            record.valueSeconds ?? 0,
                            PR_KEY_TO_DISTANCE_MAP[section.key],
                          )}
                        </span>
                      )}
                      <span className="text-muted-foreground mt-0.5 text-[10px]">
                        {toDateLabel(record?.activityStartDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Longest Run — featured */}
          {(() => {
            const longest = data.personalRecords.longestRunEver;
            const hasRecord = !!longest?.valueDistanceM;
            return (
              <Card
                className={cn(
                  "relative flex flex-col items-center justify-center gap-3 overflow-hidden p-6 md:min-w-[180px]",
                  hasRecord &&
                    "border-cyan-500/30 bg-linear-to-b from-cyan-950/40 to-transparent shadow-[0_0_24px_-6px_rgba(6,182,212,0.15)]",
                )}
              >
                <div className="rounded-full bg-cyan-500/10 p-2.5 text-cyan-400">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-muted-foreground text-[10px] tracking-widest uppercase">
                    Longest Run
                  </span>
                  <span className="text-2xl font-bold tabular-nums">
                    {hasRecord ? toDistance(longest.valueDistanceM ?? 0) : "—"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {toDateLabel(longest?.activityStartDate)}
                  </span>
                </div>
              </Card>
            );
          })()}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MonthlyDistanceChart monthlyChartData={monthlyChartData} />
        <MonthlyPaceChart paceChartData={paceChartData} />
      </div>

      {cumulativeChartData.length > 1 && (
        <CumulativeDistanceChart cumulativeChartData={cumulativeChartData} />
      )}
    </div>
  );
}

export { ProgressCockpit };
