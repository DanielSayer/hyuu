import type { Column } from "@tanstack/react-table";
import { ArrowUpDownIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "../ui/button";

interface DataTableColumnHeaderProps<
  TData,
  TValue,
> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8 px-3"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ChevronDownIcon />
      ) : column.getIsSorted() === "asc" ? (
        <ChevronUpIcon />
      ) : (
        <ArrowUpDownIcon />
      )}
    </Button>
  );
}
