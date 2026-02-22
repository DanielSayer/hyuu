import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartContainer, type ChartConfig } from "../ui/chart";

type RadialBarGraphProps = {
  value: number;
  label: string;
  displayValue?: number;
  variant: 1 | 2 | 3 | 4 | 5;
};

const colorVariants = {
  1: "var(--color-chart-1)",
  2: "var(--color-chart-2)",
  3: "var(--color-chart-3)",
  4: "var(--color-chart-4)",
  5: "var(--color-chart-5)",
};

function RadialBarGraph({
  value,
  label,
  variant,
  displayValue,
}: RadialBarGraphProps) {
  const chartVariant = colorVariants[variant];
  const chartData = [{ value, fill: chartVariant }];
  const chartConfig = {
    value: {
      label: label,
      color: chartVariant,
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={chartConfig} className="aspect-square w-full">
      <RadialBarChart
        data={chartData}
        startAngle={0}
        endAngle={(value / 100) * 360}
        innerRadius={60}
        outerRadius={80}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="last:fill-background first:fill-muted"
          polarRadius={[64, 56]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 24}
                      className="fill-muted-foreground"
                    >
                      {label}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy}
                      className="fill-foreground text-4xl font-bold"
                    >
                      {displayValue ??
                        Math.round(chartData[0].value).toLocaleString()}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}

export { RadialBarGraph };
