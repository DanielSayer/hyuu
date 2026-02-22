import { formatPace, formatTime } from "@/lib/utils";
import type { Activity } from "@/utils/types/activities";
import { GaugeIcon, TimerIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "../ui/chart";

type VelocityPoint = {
  second: number;
  velocity: number;
};

const chartConfig = {
  velocity: {
    label: "Pace",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function VelocityChart({ activity }: { activity: Activity }) {
  const velocityStream = activity.streams.find(
    (stream) => stream.streamType === "velocity_smooth",
  );

  if (
    !velocityStream ||
    !velocityStream.data ||
    !Array.isArray(velocityStream.data)
  ) {
    return null;
  }

  const chartData: VelocityPoint[] = velocityStream.data
    .map((value, index) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return null;
      }
      return { second: index, velocity: value };
    })
    .filter((point): point is VelocityPoint => point !== null);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Pace</h2>

      <ChartContainer config={chartConfig} className="h-[25vh] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8 }}
        >
          <defs>
            <linearGradient id="fillVelocity" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-velocity)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-velocity)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="second"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={30}
            tickFormatter={(value) => formatTime(Number(value))}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={56}
            tickFormatter={(value) => formatPace(Number(value))}
          />
          <ChartTooltip cursor={false} content={<VelocityTooltip />} />

          <Area
            dataKey="velocity"
            type="natural"
            stroke="var(--color-velocity)"
            fill="url(#fillVelocity)"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function VelocityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: VelocityPoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { velocity, second } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">Pace</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <GaugeIcon className="size-3.5" /> {formatPace(velocity)}/km
        </span>
        <span className="flex items-center gap-1.5">
          <TimerIcon className="size-3.5" /> {formatTime(second)}
        </span>
      </div>
    </div>
  );
}

export { VelocityChart };
