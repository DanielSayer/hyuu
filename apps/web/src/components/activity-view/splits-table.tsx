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
    <DataTable
      table={table}
      fullscreenTable={fullscreenTable}
      isExpandable
      title="Splits"
      description="All of your detailed lap data."
    />
  );
}

export { SplitsTable };
