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
  const table = useReactTable({
    data: splits,
    columns,
    initialState: {
      columnVisibility: {
        movingTime: false,
        endTime: false,
        averageSpeed: false,
        maxSpeed: false,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return <DataTable table={table} />;
}

export { SplitsTable };
