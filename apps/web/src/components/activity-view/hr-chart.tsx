import { formatSecondsToHms } from "@hyuu/utils/time";
import type { Activity } from "@/utils/types/activities";
import {
  ClockIcon,
  FootprintsIcon,
  TimerIcon,
  HeartPulseIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "../ui/chart";

type HrPoint = {
  second: number;
  heartrate: number;
};

const chartConfig = {
  heartrate: {
    label: "Heart Rate",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function HrChart({ activity }: { activity: Activity }) {
  const hrData = activity.streams.find(
    (stream) => stream.streamType === "heartrate",
  );

  if (!hrData) {
    return null;
  }

  if (!hrData.data || !Array.isArray(hrData.data)) {
    return null;
  }

  const chartData = hrData.data
    .map((value, index) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
      }

      return {
        second: index,
        heartrate: value,
      } satisfies HrPoint;
    })
    .filter((point): point is HrPoint => point !== null);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Heart Rate</h2>
        <p className="text-muted-foreground text-sm">
          Average heart rate:{" "}
          <span className="font-bold">{activity.averageHeartrate}</span>{" "}
          <span className="text-muted-foreground text-sm">bpm</span>.
        </p>
        <p className="text-muted-foreground text-sm">
          Max heart rate:{" "}
          <span className="font-bold">{activity.maxHeartrate}</span>{" "}
          <span className="text-muted-foreground text-sm">bpm</span>.
        </p>
      </div>

      <ChartContainer config={chartConfig} className="h-[25vh] max-h-64 w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 8, right: 8 }}
        >
          <defs>
            <linearGradient id="fillHeartrate" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-heartrate)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-heartrate)"
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
            tickFormatter={(value) => formatSecondsToHms(Number(value))}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={40}
            domain={([dataMin, dataMax]) => [dataMin - 10, dataMax + 5]}
          />
          <ChartTooltip cursor={false} content={<HeartrateTooltip />} />
          {activity.averageHeartrate && (
            <ReferenceLine
              y={activity.averageHeartrate}
              strokeDasharray="5 5"
              stroke="var(--color-heartrate)"
            >
              <Label
                value={activity.averageHeartrate}
                offset={10}
                position="left"
              />
            </ReferenceLine>
          )}

          <Area
            dataKey="heartrate"
            type="natural"
            stroke="var(--color-heartrate)"
            fill="url(#fillHeartrate)"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function HeartrateTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: HrPoint }[];
}) {
  if (!active || !payload?.length) return null;

  const { heartrate, second } = payload[0].payload;

  return (
    <div className="border-border bg-background rounded-lg border px-3 py-2 shadow-md">
      <p className="text-sm font-medium">Heart Rate</p>
      <div className="text-muted-foreground mt-1 flex flex-col gap-0.5 text-sm">
        <span className="flex items-center gap-1.5">
          <HeartPulseIcon className="size-3.5" /> {heartrate} bpm
        </span>
        <span className="flex items-center gap-1.5">
          <TimerIcon className="size-3.5" /> {formatSecondsToHms(second)}
        </span>
      </div>
    </div>
  );
}

export { HrChart };
