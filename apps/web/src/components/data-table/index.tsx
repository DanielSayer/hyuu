import { cn } from "@/lib/utils";
import { flexRender, type Table as ReactTable } from "@tanstack/react-table";
import { LoadingWrapper } from "../loading-wrapper";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ColumnVisibility } from "./column-visibility";
import { FullscreenTableButton } from "./fullscreen-table-button";

type TableExpansionProps =
  | {
      isExpandable: true;
      title: string;
      description: string;
    }
  | {
      isExpandable?: false;
    };

type DataTableProps<TData> = TableExpansionProps & {
  table: ReactTable<TData>;
  fullscreenTable?: ReactTable<TData>;
  isLoading?: boolean;
};

function DataTable<TData>({
  table,
  fullscreenTable,
  isLoading,
  isExpandable,
  ...props
}: DataTableProps<TData>) {
  const numberOfColumns = table.getAllColumns().length;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex justify-end">
        {isExpandable && "title" in props && "description" in props && (
          <FullscreenTableButton
            table={fullscreenTable ?? table}
            title={props.title}
            description={props.description}
          />
        )}
        <ColumnVisibility table={table} />
      </div>
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const className = hasClassName(meta)
                  ? meta.className
                  : undefined;
                return (
                  <TableHead
                    key={header.id}
                    className={cn("truncate", className)}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <LoadingWrapper
            isLoading={isLoading ?? false}
            fallback={<LoadingState numberOfColumns={numberOfColumns} />}
          >
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={numberOfColumns} className="text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const className = hasClassName(meta)
                      ? meta.className
                      : undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn("truncate", className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </LoadingWrapper>
        </TableBody>
        {table
          .getFooterGroups()
          .map((footerGroup) =>
            footerGroup.headers.map((header) => header.column.columnDef.footer),
          )
          .flat()
          .filter(Boolean).length > 0 && (
          <TableFooter>
            {table.getFooterGroups().map((footerGroup) => (
              <TableRow key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <TableCell key={header.id}>
                    {flexRender(
                      header.column.columnDef.footer,
                      header.getContext(),
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableFooter>
        )}
      </Table>
    </div>
  );
}

function hasClassName(meta: unknown): meta is { className?: string } {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "className" in meta &&
    typeof meta.className === "string"
  );
}

const LoadingState = ({ numberOfColumns }: { numberOfColumns: number }) => {
  return (
    <>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={numberOfColumns}>
          <Skeleton className="h-5 w-full" />
        </TableCell>
      </TableRow>
    </>
  );
};

export { DataTable };
