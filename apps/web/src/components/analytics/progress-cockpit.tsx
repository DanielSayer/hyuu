import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToMinsPerKm } from "@hyuu/utils/pace";
import { formatSecondsToHms } from "@hyuu/utils/time";
import { format } from "date-fns";
import { MapPinIcon, TrophyIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Medal } from "../medal";
import { DISTANCE_CONFIG, PR_KEY_TO_DISTANCE_MAP } from "@/lib/best-efforts";
import { formatPace } from "@hyuu/api/utils";

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
    fastest1km: {
      valueSeconds: number | null;
      activityStartDate: string | Date | null;
    } | null;
    fastest5k: {
      valueSeconds: number | null;
      activityStartDate: string | Date | null;
    } | null;
    fastest10k: {
      valueSeconds: number | null;
      activityStartDate: string | Date | null;
    } | null;
    fastestHalf: {
      valueSeconds: number | null;
      activityStartDate: string | Date | null;
    } | null;
    fastestFull: {
      valueSeconds: number | null;
      activityStartDate: string | Date | null;
    } | null;
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

const CHART_COLOR = "var(--chart-1)";

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
        <Card className="border-primary/30 bg-primary/5 p-4">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            This Year
          </p>
          <p className="mt-1 text-3xl font-bold">
            {toDistance(data.kpis.distanceThisYear)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {toDuration(data.kpis.timeRunThisYear)} total
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            This Month
          </p>
          <p className="mt-1 text-3xl font-bold">
            {toDistance(data.kpis.distanceThisMonth)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {toDuration(data.kpis.timeRunThisMonth)} total
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            Runs This Year
          </p>
          <p className="mt-1 text-3xl font-bold">{data.kpis.runsThisYear}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {data.kpis.runsThisMonth} this month
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            Avg Monthly Distance
          </p>
          <p className="mt-1 text-3xl font-bold">
            {toDistance(data.kpis.avgMonthlyDistance)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">12 month average</p>
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
        <Card className="p-4">
          <p className="mb-2 text-base font-semibold">Monthly Distance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" km" />
                <Tooltip
                  formatter={(value: number) => [`${value} km`, "Distance"]}
                />
                <Bar
                  dataKey="distanceKm"
                  fill={CHART_COLOR}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-base font-semibold">Monthly Pace Trend</p>
          {paceChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={paceChartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    unit=" /km"
                    tickFormatter={(value) =>
                      formatSecondsToMinsPerKm(Number(value), {
                        showUnit: false,
                      })
                    }
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatSecondsToMinsPerKm(Number(value)),
                      "Pace",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="paceSecPerKm"
                    stroke={CHART_COLOR}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
              No pace data yet
            </div>
          )}
        </Card>
      </div>

      {cumulativeChartData.length > 1 && (
        <Card className="p-4">
          <p className="mb-2 text-base font-semibold">
            Cumulative Distance (Year)
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeChartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" km" />
                <Tooltip
                  formatter={(value: number) => [`${value} km`, "Total"]}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeKm"
                  stroke={CHART_COLOR}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

export { ProgressCockpit };
