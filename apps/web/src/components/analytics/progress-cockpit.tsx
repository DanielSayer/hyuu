import { Card } from "@/components/ui/card";
import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToMinsPerKm } from "@hyuu/utils/pace";
import { formatSecondsToHms } from "@hyuu/utils/time";
import { format } from "date-fns";
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

function ProgressCockpit({ data }: ProgressCockpitProps) {
  const monthlyChartData = data.monthly.map((row) => ({
    month: format(new Date(row.monthStart), "MMM"),
    distanceKm: Number((row.distanceM / 1000).toFixed(2)),
    paceSecPerKm: row.avgPaceSecPerKm ?? 0,
    cumulativeKm: 0,
    hasPace: row.avgPaceSecPerKm !== null,
  }));

  let runningKm = 0;
  for (const month of monthlyChartData) {
    runningKm += month.distanceKm;
    month.cumulativeKm = Number(runningKm.toFixed(2));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-base font-semibold">Monthly Distance</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" km" />
                <Tooltip />
                <Bar dataKey="distanceKm" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <p className="mb-2 text-base font-semibold">Monthly Pace Trend</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    formatSecondsToMinsPerKm(Number(value), { showUnit: false })
                  }
                />
                <Tooltip
                  formatter={(value: number) =>
                    formatSecondsToMinsPerKm(Number(value))
                  }
                />
                <Line
                  type="monotone"
                  dataKey="paceSecPerKm"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="mb-2 text-base font-semibold">Cumulative Distance (Year)</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} unit=" km" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="cumulativeKm"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight">Personal Records</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {PR_SECTIONS.map((section) => {
            const record = data.personalRecords[section.key];
            return (
              <Card key={section.key} className="p-4">
                <p className="text-muted-foreground text-xs tracking-widest uppercase">
                  {section.label}
                </p>
                <p className="mt-1 text-xl font-bold">
                  {record?.valueSeconds ? formatSecondsToHms(record.valueSeconds) : "—"}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {toDateLabel(record?.activityStartDate)}
                </p>
              </Card>
            );
          })}

          <Card className="p-4">
            <p className="text-muted-foreground text-xs tracking-widest uppercase">
              Longest Run
            </p>
            <p className="mt-1 text-xl font-bold">
              {toDistance(data.personalRecords.longestRunEver?.valueDistanceM ?? 0)}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {toDateLabel(data.personalRecords.longestRunEver?.activityStartDate)}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { ProgressCockpit };
