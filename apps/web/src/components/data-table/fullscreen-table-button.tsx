import type { Table as ReactTable } from "@tanstack/react-table";
import { ExpandIcon } from "lucide-react";
import { DataTable } from ".";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

type FullscreenTableButtonProps<TData> = {
  title: string;
  description: string;
  table: ReactTable<TData>;
};

function FullscreenTableButton<TData>({
  table,
  title,
  description,
}: FullscreenTableButtonProps<TData>) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon">
            <ExpandIcon />
            <span className="sr-only">Expand table</span>
          </Button>
        }
      />
      <DialogContent className="w-full sm:max-w-[90vw]">
        <DialogHeader className="-mb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DataTable table={table} />
      </DialogContent>
    </Dialog>
  );
}

export { FullscreenTableButton };
