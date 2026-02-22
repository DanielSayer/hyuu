import { formatTime } from "@/lib/utils";
import type { Activity } from "@/utils/types/activities";
import { FootprintsIcon, TimerIcon } from "lucide-react";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "../ui/chart";

type CadencePoint = {
  second: number;
  cadence: number;
};

type ScatterShapeProps = {
  cx?: number;
  cy?: number;
  payload?: CadencePoint;
};

const chartConfig = {
  cadence: {
    label: "Cadence",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function getCadenceColor(cadence: number): string {
  if (cadence > 183) return "#a855f7"; // purple-500
  if (cadence >= 174) return "#3b82f6"; // blue-500
  if (cadence >= 164) return "#22c55e"; // green-500
  if (cadence >= 153) return "#f97316"; // orange-500
  return "#ef4444"; // red-500
}

function CadenceChart({ activity }: { activity: Activity }) {
  const cadenceStream = activity.streams.find(
    (stream) => stream.streamType === "cadence",
  );

  if (
    !cadenceStream ||
    !cadenceStream.data ||
    !Array.isArray(cadenceStream.data)
  ) {
    return null;
  }

  const chartData: CadencePoint[] = cadenceStream.data
    .map((value, index) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
      }
      return { second: index, cadence: value * 2 };
    })
    .filter((point): point is CadencePoint => point !== null);

  if (chartData.length === 0) {
    return null;
  }

  const renderDot = ({ cx, cy, payload }: ScatterShapeProps) => {
    if (!payload || cx === undefined || cy === undefined) return <g />;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill={getCadenceColor(payload.cadence)}
      />
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Cadence</h2>

      <ChartContainer config={chartConfig} className="h-[25vh] w-full">
        <ScatterChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8 }}
        >
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
            width={40}
            domain={([dataMin, dataMax]) => [
              Math.max(0, dataMin - 10),
              dataMax + 5,
            ]}
          />
          <ChartTooltip cursor={false} content={<CadenceTooltip />} />
          <Scatter dataKey="cadence" shape={renderDot} />
        </ScatterChart>
      </ChartContainer>
    </div>
  );
}

function CadenceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: CadencePoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { cadence, second } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">Cadence</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <FootprintsIcon className="size-3.5" /> {cadence} spm
        </span>
        <span className="flex items-center gap-1.5">
          <TimerIcon className="size-3.5" /> {formatTime(second)}
        </span>
      </div>
    </div>
  );
}

export { CadenceChart };
