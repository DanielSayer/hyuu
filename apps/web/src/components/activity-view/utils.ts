import type { Activity } from "@/utils/types/activities";
import { formatSpeedToMinsPerKm } from "@hyuu/utils/pace";

const metricKeys = [
  "heartrate",
  "cadence",
  "velocity_smooth",
  "fixed_altitude",
] as const;

type MetricKey = (typeof metricKeys)[number];

type MetricSpec = {
  label: string;
  unit: string;
  color: string;
  normalizeRawValue: (value: unknown) => number | null;
  formatAxisValue: (value: number) => string;
  formatTooltipValue: (value: number) => string;
};

type CompareChartPoint = {
  second: number;
} & Partial<Record<MetricKey, number>>;

type MetricSeriesPoint = {
  second: number;
  value: number;
};

const metricSpecs: Record<MetricKey, MetricSpec> = {
  heartrate: {
    label: "Heart Rate",
    unit: "bpm",
    color: "var(--chart-3)",
    normalizeRawValue: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
      }
      return value;
    },
    formatAxisValue: (value) => `${Math.round(value)}`,
    formatTooltipValue: (value) => `${Math.round(value)} bpm`,
  },
  cadence: {
    label: "Cadence",
    unit: "spm",
    color: "var(--chart-2)",
    normalizeRawValue: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
      }
      return value * 2;
    },
    formatAxisValue: (value) => `${Math.round(value)}`,
    formatTooltipValue: (value) => `${Math.round(value)} spm`,
  },
  velocity_smooth: {
    label: "Pace",
    unit: "/km",
    color: "var(--chart-4)",
    normalizeRawValue: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return null;
      }
      return value;
    },
    formatAxisValue: (value) => formatSpeedToMinsPerKm(value),
    formatTooltipValue: (value) => `${formatSpeedToMinsPerKm(value)}/km`,
  },
  fixed_altitude: {
    label: "Elevation",
    unit: "m",
    color: "var(--chart-5)",
    normalizeRawValue: (value) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return null;
      }
      return value;
    },
    formatAxisValue: (value) => `${Math.round(value)}`,
    formatTooltipValue: (value) => `${Math.round(value)} m`,
  },
};

function getMetricSeries(
  activity: Activity,
  metric: MetricKey,
): MetricSeriesPoint[] {
  const stream = activity.streams.find((x) => x.streamType === metric);
  if (!stream || !Array.isArray(stream.data)) {
    return [];
  }

  return stream.data
    .map((rawValue, second) => {
      const value = metricSpecs[metric].normalizeRawValue(rawValue);
      if (value === null) {
        return null;
      }
      return { second, value } satisfies MetricSeriesPoint;
    })
    .filter((point): point is MetricSeriesPoint => point !== null);
}

function getAvailableMetrics(activity: Activity): MetricKey[] {
  return metricKeys.filter(
    (metric) => getMetricSeries(activity, metric).length > 0,
  );
}

function buildCompareChartData(
  activity: Activity,
  selectedMetrics: MetricKey[],
): CompareChartPoint[] {
  const rows = new Map<number, CompareChartPoint>();

  for (const metric of selectedMetrics) {
    const series = getMetricSeries(activity, metric);
    for (const point of series) {
      const current = rows.get(point.second) ?? { second: point.second };
      current[metric] = point.value;
      rows.set(point.second, current);
    }
  }

  return [...rows.values()].sort((a, b) => a.second - b.second);
}

export {
  buildCompareChartData,
  getAvailableMetrics,
  getMetricSeries,
  metricKeys,
  metricSpecs,
};
export type { CompareChartPoint, MetricKey, MetricSpec };
