import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Flame,
  MapPin,
  MoreHorizontal,
  Pause,
  Pencil,
  Repeat,
  Timer,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";

type GoalType = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";
type GoalStatus = "on-track" | "at-risk" | "behind" | "completed";

interface Goal {
  id: string;
  goalType: GoalType;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  trackStreak: boolean;
  currentStreak: number;
  bestStreak: number;
  status: GoalStatus;
  createdAt: string;
  resetsAt: string;
}

function getProgressPercent(goal: Goal): number {
  if (goal.goalType === "pace") {
    // For pace, lower is better. Progress = how close current is to target.
    // If target is 5.30 and current is 5.52, that's partial progress.
    // If current <= target, that's 100%.
    if (goal.currentValue <= goal.targetValue) return 100;
    const start = goal.targetValue + 1; // assume starting ~1 min slower
    const progress =
      ((start - goal.currentValue) / (start - goal.targetValue)) * 100;
    return Math.max(0, Math.min(100, progress));
  }
  return Math.min(100, (goal.currentValue / goal.targetValue) * 100);
}

function formatValue(value: number, goalType: GoalType): string {
  if (goalType === "pace") {
    const mins = Math.floor(value);
    const secs = Math.round((value - mins) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  if (goalType === "distance") {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  }
  return value.toString();
}

function getDaysUntilReset(resetsAt: string): number {
  const now = new Date("2026-02-28");
  const reset = new Date(resetsAt);
  const diff = Math.ceil(
    (reset.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, diff);
}

const goalTypeConfig: Record<
  GoalType,
  { label: string; unit: string; icon: LucideIcon }
> = {
  distance: { label: "Distance", unit: "km", icon: MapPin },
  frequency: { label: "Frequency", unit: "runs", icon: Repeat },
  pace: { label: "Pace", unit: "min/km", icon: Timer },
};

function GoalCard({ goal }: { goal: Goal }) {
  const config = goalTypeConfig[goal.goalType];
  const Icon = config.icon;
  const progress = getProgressPercent(goal);
  const daysLeft = getDaysUntilReset(goal.resetsAt);

  const accent =
    goal.status === "completed"
      ? {
          text: "text-teal-400",
          barFilled: "bg-teal-400",
          barPartial: "bg-teal-400/30",
        }
      : goal.status === "behind"
        ? {
            text: "text-rose-400",
            barFilled: "bg-rose-400",
            barPartial: "bg-rose-400/30",
          }
        : goal.status === "at-risk"
          ? {
              text: "text-amber-400",
              barFilled: "bg-amber-400",
              barPartial: "bg-amber-400/30",
            }
          : {
              text: "text-emerald-400",
              barFilled: "bg-emerald-400",
              barPartial: "bg-emerald-400/30",
            };

  return (
    <div className="group bg-card relative overflow-hidden rounded-xl border p-0 transition-all hover:border-white/1">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4", accent.text)} />
          <span
            className={cn("text-sm font-semibold tracking-wide", accent.text)}
          >
            {config.label}
          </span>
          <Badge variant="secondary" className="uppercase">
            {goal.cadence}
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          {goal.status !== "completed" && (
            <span className="text-[10px] font-medium tracking-wider text-white/25 uppercase tabular-nums">
              {daysLeft} days left
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="rounded-md p-1 text-white/20 transition-colors hover:bg-white/5 hover:text-white/50">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs">
                <Pencil className="mr-2 h-3 w-3" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs">
                <Pause className="mr-2 h-3 w-3" /> Pause
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="text-xs">
                <Trash2 className="mr-2 h-3 w-3" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main readout */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-wider text-white/25 uppercase">
              Current
            </p>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-5xl leading-none font-bold tracking-tight tabular-nums",
                  accent.text,
                )}
              >
                {formatValue(goal.currentValue, goal.goalType)}
              </span>
              <span className="pb-0.5 text-sm font-medium text-white/20">
                {config.unit}
              </span>
            </div>
          </div>
          <div className="pb-1.5 text-right">
            <p className="text-[10px] font-medium tracking-wider text-white/25 uppercase">
              Target
            </p>
            <span className="text-lg font-semibold text-white/35 tabular-nums">
              {formatValue(goal.targetValue, goal.goalType)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2 px-5 pt-3 pb-1">
        <div className="flex gap-[2px]">
          {Array.from({ length: 20 }).map((_, i) => {
            const segmentProgress = (i + 1) * 5;
            const isFilled = progress >= segmentProgress;
            const isPartial = !isFilled && progress >= segmentProgress - 5;
            return (
              <div
                key={i}
                className={cn(
                  "h-[6px] flex-1 rounded-[1px] transition-all duration-300",
                  {
                    [accent.barFilled]: isFilled,
                    [accent.barPartial]: isPartial,
                    "bg-white/6": !isFilled && !isPartial,
                  },
                )}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] font-medium text-white/25 tabular-nums">
            {Math.round(progress)}% complete
          </span>
          {goal.goalType !== "pace" && goal.status !== "completed" && (
            <span className="text-[10px] font-medium text-white/25 tabular-nums">
              {formatValue(goal.targetValue - goal.currentValue, goal.goalType)}{" "}
              {config.unit} remaining
            </span>
          )}
        </div>
      </div>

      {/* Streak */}
      {goal.trackStreak && (
        <div className="mx-5 mt-3 flex items-center justify-between border-t border-white/6 py-3">
          <div className="flex items-center gap-2">
            <Flame
              className={cn(
                "h-3.5 w-3.5",
                goal.currentStreak > 0 ? "text-orange-400" : "text-white/15",
              )}
            />
            <span className="text-xs font-medium tracking-wide text-white/40">
              {goal.currentStreak > 0 ? (
                <>
                  {goal.currentStreak}{" "}
                  {goal.cadence === "weekly" ? "week" : "month"} streak
                </>
              ) : (
                "No streak"
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium tracking-wider text-white/20">
              Best
            </span>
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                accent.text,
                "opacity-50",
              )}
            >
              {goal.bestStreak}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { GoalCard };
