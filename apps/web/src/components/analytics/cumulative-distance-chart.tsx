import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui/card";
import { FootprintsIcon, MountainIcon, TimerIcon } from "lucide-react";
import { formatSecondsToHms } from "@hyuu/utils/time";

type CumulativeDistancePoint = {
  month: string;
  cumulativeKm: number;
};

type CumulativeDistanceChartProps = {
  cumulativeChartData: CumulativeDistancePoint[];
};

function CumulativeDistanceChart({
  cumulativeChartData,
}: CumulativeDistanceChartProps) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-base font-semibold">Cumulative Distance (Year)</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cumulativeChartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit=" km" />
            <Tooltip content={<CumulativeDistanceTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulativeKm"
              stroke={"var(--chart-3)"}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function CumulativeDistanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: CumulativeDistancePoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { cumulativeKm, month } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{month} Cumulative Distance</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <FootprintsIcon className="size-3.5" /> {Math.round(cumulativeKm)} km
        </span>
      </div>
    </div>
  );
}

export { CumulativeDistanceChart };
