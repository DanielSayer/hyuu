import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { Card } from "../ui/card";
import { ChartTooltip } from "../ui/chart";
import { FootprintsIcon, MountainIcon } from "lucide-react";

type MonthlyDistancePoint = {
  month: string;
  distanceKm: number;
};

type MonthlyDistanceChartProps = {
  monthlyChartData: MonthlyDistancePoint[];
};

function MonthlyDistanceChart({ monthlyChartData }: MonthlyDistanceChartProps) {
  return (
    <Card className="p-4">
      <p className="mb-2 text-base font-semibold">Monthly Distance</p>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyChartData}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              strokeWidth={0.25}
            />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} unit=" km" />
            <ChartTooltip content={<MonthlyDistanceTooltip />} />
            <Bar
              dataKey="distanceKm"
              fill={"var(--chart-1)"}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MonthlyDistanceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: MonthlyDistancePoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { distanceKm, month } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{month} Distance</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <FootprintsIcon className="size-3.5" /> {Math.round(distanceKm)} km
        </span>
      </div>
    </div>
  );
}

export { MonthlyDistanceChart };
