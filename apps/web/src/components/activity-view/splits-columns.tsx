import { cn, formatDistance, formatSpeed, formatTime } from "@/lib/utils";
import type { ActivitySplit } from "@/utils/types/activities";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table/column-header";
import { Badge } from "../ui/badge";

type SplitsTableData = ActivitySplit & {
  lapNumber: number;
};

const columnHelper = createColumnHelper<SplitsTableData>();

export const columns = [
  columnHelper.accessor("lapNumber", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lap" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          {row.original.lapNumber}
          <Badge variant="outline">{row.original.intervalType}</Badge>
        </div>
      );
    },
    meta: {
      title: "Lap",
    },
  }),
  columnHelper.accessor("distance", {
    header: () => <Header title="Distance" sub="km" />,
    cell: ({ row }) => formatDistance(row.original.distance),
    meta: {
      title: "Distance",
    },
  }),
  columnHelper.accessor("startTime", {
    header: () => <Header title="Start Time" />,
    cell: ({ row }) =>
      row.original.startTime ? formatTime(row.original.startTime) : "0:00",
    meta: {
      title: "Start Time",
    },
  }),
  columnHelper.accessor("elapsedTime", {
    header: () => <Header title="Elapsed Time" />,
    cell: ({ row }) => formatTime(row.original.elapsedTime),
    meta: {
      title: "Elapsed Time",
    },
  }),
  columnHelper.accessor("movingTime", {
    header: () => <Header title="Moving Time" />,
    cell: ({ row }) => formatTime(row.original.movingTime),

    meta: {
      title: "Moving Time",
    },
  }),
  columnHelper.accessor("endTime", {
    header: () => <Header title="End Time" />,
    cell: ({ row }) => formatTime(row.original.endTime),
    meta: {
      title: "End Time",
    },
  }),
  columnHelper.accessor("averageSpeed", {
    header: () => <Header title="Average Speed" sub="km/h" />,
    cell: ({ row }) => formatSpeed(row.original.averageSpeed),
    meta: {
      title: "Average Speed",
    },
  }),
  columnHelper.accessor("maxSpeed", {
    header: () => <Header title="Max Speed" sub="km/h" />,
    cell: ({ row }) => formatSpeed(row.original.maxSpeed),
    meta: {
      title: "Max Speed",
    },
  }),
  columnHelper.accessor("averageHeartrate", {
    header: () => <Header title="Average HR" sub="bpm" />,
    cell: ({ row }) =>
      row.original.averageHeartrate
        ? Math.round(row.original.averageHeartrate)
        : "—",
    meta: {
      title: "Average Heartrate",
    },
  }),
  columnHelper.accessor("maxHeartrate", {
    header: () => <Header title="Max HR" sub="bpm" />,
    cell: ({ row }) =>
      row.original.maxHeartrate ? Math.round(row.original.maxHeartrate) : "—",
    meta: {
      title: "Max Heartrate",
    },
  }),
  columnHelper.accessor("zone", {
    header: () => <Header title="HR Zone" />,
    cell: ({ row }) => (row.original.zone ? row.original.zone : "—"),
    meta: {
      title: "HR Zone",
    },
  }),
  columnHelper.accessor("intensity", {
    header: () => <Header title="Intensity" />,
    cell: ({ row }) => (row.original.intensity ? row.original.intensity : "—"),
    meta: {
      title: "Intensity",
    },
  }),
  columnHelper.accessor("averageCadence", {
    header: () => <Header title="Cadence" sub="spm" />,
    cell: ({ row }) =>
      row.original.averageCadence
        ? Math.round(row.original.averageCadence)
        : "—",
    meta: {
      title: "Average Cadence",
    },
  }),
  columnHelper.accessor("averageStride", {
    header: () => <Header title="Stride Length" sub="m" />,
    cell: ({ row }) =>
      row.original.averageStride ? row.original.averageStride.toFixed(2) : "—",
    meta: {
      title: "Average Stride",
    },
  }),
  columnHelper.accessor("totalElevationGain", {
    header: () => <Header title="Elevation Gain" sub="m" />,
    cell: ({ row }) =>
      row.original.totalElevationGain
        ? Math.round(row.original.totalElevationGain)
        : "0",
    meta: {
      title: "Total Elevation Gain",
    },
  }),
];

type HeaderProps = {
  title: string;
  sub?: string;
};

function Header({ title, sub }: HeaderProps) {
  return (
    <div className={cn("pb-1", { "pb-5": !sub })}>
      <p className="font-medium">{title}</p>
      <p className="text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}
