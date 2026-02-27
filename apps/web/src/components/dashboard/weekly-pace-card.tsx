import { Card } from "@/components/ui/card";
import { formatSecondsToMinsPerKm } from "@hyuu/utils/pace";
import { addDays, format, parseISO } from "date-fns";
import { TimerIcon } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface WeeklyPaceCardProps {
  weeklyPace: {
    weekStart: string;
    paceSecPerKm: number;
  }[];
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) => {
  if (!active || !payload?.length) return null;

  const { value } = payload[0];

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">Distance</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs">
          <TimerIcon className="size-3.5" /> {formatSecondsToMinsPerKm(value)}
        </span>
      </div>
    </div>
  );
};

export function WeeklyPaceCard({ weeklyPace }: WeeklyPaceCardProps) {
  const chartData = useMemo(() => {
    const data = weeklyPace.map((w) => ({
      week: format(parseISO(w.weekStart), "d MMM"),
      paceSecPerKm: w.paceSecPerKm,
    }));

    if (data.length < 12 && weeklyPace.length > 0) {
      const firstWeekStart = parseISO(weeklyPace[0].weekStart);
      const weeksToAdd = 12 - data.length;

      for (let i = weeksToAdd; i > 0; i--) {
        const weekStart = addDays(firstWeekStart, -7 * i);
        data.unshift({
          week: format(weekStart, "d MMM"),
          paceSecPerKm: 0,
        });
      }
    }

    return data;
  }, [weeklyPace]);

  const thisWeek = weeklyPace[weeklyPace.length - 1];
  const lastWeek = weeklyPace[weeklyPace.length - 2];

  const thisWeekPace = thisWeek ? thisWeek.paceSecPerKm : 0;
  const lastWeekPace = lastWeek ? lastWeek.paceSecPerKm : 0;
  const weekDelta = thisWeekPace - lastWeekPace;
  const weekDeltaPositive = weekDelta >= 0;

  const avgPace = useMemo(
    () =>
      weeklyPace.reduce((sum, w) => sum + w.paceSecPerKm, 0) /
      (weeklyPace.length || 1),
    [weeklyPace],
  );

  const thisWeekRange = useMemo(() => {
    if (!thisWeek) return "";
    const start = parseISO(thisWeek.weekStart);
    const end = addDays(start, 6);
    return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
  }, [thisWeek]);

  return (
    <Card className="p-4">
      <p className="-mb-2 text-right text-xs text-zinc-500">{thisWeekRange}</p>

      <div className="grid grid-cols-3 gap-4">
        {/* Primary stat — this week's distance */}
        <div className="mt-auto mb-2 flex flex-col">
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
            This week
          </p>
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-bold">
              {formatSecondsToMinsPerKm(thisWeek?.paceSecPerKm ?? 0, {
                showUnit: false,
              })}
            </span>
            <span className="mb-0.5 text-lg font-medium text-zinc-400">
              /km
            </span>
          </div>

          {/* vs last week */}
          <div className="mt-4 flex gap-4">
            <div>
              <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                vs last week
              </p>
              <p
                className={`text-sm font-semibold ${
                  weekDeltaPositive ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {weekDeltaPositive ? "+" : ""}
                {weekDelta.toFixed(1)}s/km
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                Avg/week
              </p>
              <p className="text-foreground/90 text-sm font-semibold">
                {formatSecondsToMinsPerKm(avgPace)}
              </p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="col-span-2 h-28">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -32, bottom: 0 }}
            >
              <defs>
                <linearGradient id="distanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="week"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  formatSecondsToMinsPerKm(v, { showUnit: false })
                }
              />

              <ReferenceLine
                y={avgPace}
                stroke="#52525b"
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              <Tooltip content={<CustomTooltip />} cursor={false} />

              <Area
                type="monotone"
                dataKey="paceSecPerKm"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#distanceGrad)"
                dot={{ fill: "var(--chart-1)", r: 3, strokeWidth: 0 }}
                activeDot={{
                  fill: "var(--chart-1)",
                  r: 5,
                  stroke: "#065f46",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
