import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { TablePropertiesIcon } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import type { Table } from "@tanstack/react-table";
import { Label } from "../ui/label";

type ColumnVisibilityProps<TData> = {
  table: Table<TData>;
};

function ColumnVisibility<TData>({ table }: ColumnVisibilityProps<TData>) {
  const columns = table.getAllColumns();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" className="items-center">
            <TablePropertiesIcon /> Columns
          </Button>
        }
      />
      <PopoverContent align="end">
        <div>
          <p className="mb-1 text-base font-semibold">Show/Hide Columns</p>
          <div className="space-y-1">
            {columns.map((column) => {
              const metaData = column.columnDef.meta;
              const title =
                metaData && "title" in metaData
                  ? (metaData.title as string)
                  : column.id;

              return (
                <Label key={column.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  />
                  <span>{title}</span>
                </Label>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { ColumnVisibility };
