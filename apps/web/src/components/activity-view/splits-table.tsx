import type { ActivitySplit } from "@/utils/types/activities";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { DataTable } from "../data-table";
import { columns } from "./splits-columns";

type SplitsTableProps = {
  splits: (ActivitySplit & { lapNumber: number })[];
};

function SplitsTable({ splits }: SplitsTableProps) {
  const createBaseTableOptions = () => ({
    data: splits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const table = useReactTable({
    ...createBaseTableOptions(),
    initialState: {
      columnVisibility: {
        movingTime: false,
        endTime: false,
        averageSpeed: false,
        maxSpeed: false,
      },
    },
  });
  const fullscreenTable = useReactTable(createBaseTableOptions());

  return (
    <div>
      <div className="-mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Splits</h2>
        <p className="text-muted-foreground text-sm">
          Detailed lap data for your activity.
        </p>
      </div>
      <DataTable
        table={table}
        fullscreenTable={fullscreenTable}
        isExpandable
        title="Splits"
        description="All of your detailed lap data."
      />
    </div>
  );
}

export { SplitsTable };
