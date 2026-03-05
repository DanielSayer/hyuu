import {
  formatSecondsToMinsPerKm,
  formatSpeedToMinsPerKm,
} from "@hyuu/utils/pace";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  LineChart,
} from "recharts";
import { Card } from "../ui/card";
import { GaugeIcon, TimerIcon } from "lucide-react";
import { formatSecondsToHms } from "@hyuu/utils/time";

type MonthlyPacePoint = {
  month: string;
  paceSecPerKm: number | null;
};

type MonthlyPaceChartProps = {
  paceChartData: MonthlyPacePoint[];
};

function MonthlyPaceChart({ paceChartData }: MonthlyPaceChartProps) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-base font-semibold">Monthly Pace Trend</p>
      {paceChartData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paceChartData}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                strokeWidth={0.25}
              />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                unit="/km"
                tickFormatter={(value) =>
                  formatSecondsToMinsPerKm(Number(value), {
                    showUnit: false,
                  })
                }
              />
              <Tooltip content={<MonthlyPaceTooltip />} />
              <Line
                type="monotone"
                dataKey="paceSecPerKm"
                stroke={"var(--chart-2)"}
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
  );
}

function MonthlyPaceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: MonthlyPacePoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { paceSecPerKm, month } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{month} Pace</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <GaugeIcon className="size-3.5" />{" "}
          {formatSecondsToMinsPerKm(paceSecPerKm)}
        </span>
      </div>
    </div>
  );
}

export { MonthlyPaceChart };
