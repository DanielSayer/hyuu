import { cn } from "@/lib/utils";
import { weekDayOptions } from "./constants";

interface WeekdaySelectorProps {
  value: number[];
  onChange: (value: number[]) => void;
}

export function WeekdaySelector({ value, onChange }: WeekdaySelectorProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDayOptions.map((day) => {
        const selected = value.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            className={cn(
              "h-10 w-full rounded-xl border text-sm font-medium transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:bg-muted hover:text-foreground",
            )}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((item) => item !== day.value)
                  : [...value, day.value].sort((a, b) => a - b),
              )
            }
          >
            {day.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
