import {
  formatGoalValue,
  getGoalProgressPercent,
  goalTypeConfig,
  type Goal,
  type GoalStatus,
} from "@/lib/goals";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Flame, PlusIcon, TargetIcon } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { Button } from "../ui/button";

const statusAccent: Record<GoalStatus, { text: string; bar: string }> = {
  completed: { text: "text-teal-400", bar: "bg-teal-400" },
  "on-track": { text: "text-emerald-400", bar: "bg-emerald-400" },
  "at-risk": { text: "text-amber-400", bar: "bg-amber-400" },
  behind: { text: "text-rose-400", bar: "bg-rose-400" },
};

function DashboardGoalRow({ goal }: { goal: Goal }) {
  const config = goalTypeConfig[goal.goalType];
  const Icon = config.icon;
  const accent = statusAccent[goal.status];
  const progress = getGoalProgressPercent(goal);

  return (
    <div className="flex items-center gap-3 py-2.5">
      {/* Icon */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5",
          accent.text,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      {/* Info + bar */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-white/60">
            {config.label}
          </span>
          <div className="flex items-baseline gap-1">
            <span className={cn("text-xs font-bold tabular-nums", accent.text)}>
              {formatGoalValue(goal.currentValue, goal.goalType)}
            </span>
            <span className="text-[10px] text-white/20">/</span>
            <span className="text-[10px] font-medium text-white/30 tabular-nums">
              {formatGoalValue(goal.targetValue, goal.goalType)}
            </span>
            <span className="text-[10px] text-white/20">{config.unit}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/6">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              accent.bar,
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Streak (compact) */}
      {goal.trackStreak && goal.currentStreak > 0 && (
        <div className="flex shrink-0 items-center gap-0.5">
          <Flame className="h-3 w-3 text-orange-400" />
          <span className="text-[10px] font-bold text-orange-400/70 tabular-nums">
            {goal.currentStreak}
          </span>
        </div>
      )}
    </div>
  );
}

function DashboardGoalsWidget({ goals }: { goals: Goal[] }) {
  const completed = goals.filter((g) => g.status === "completed").length;

  return (
    <div className="bg-card h-fit rounded-xl border p-5">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/80">Goals</h3>
        <Link
          to="/goals"
          className="group/link flex items-center gap-1 text-[11px] font-medium text-white/30 transition-colors hover:text-white/60"
        >
          View all
          <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
        </Link>
      </div>

      {/* Summary line */}
      <p className="mb-3 text-[11px] text-white/20">
        {completed}/{goals.length} completed this period
      </p>

      {/* Goal rows */}
      <div className="divide-y divide-white/5">
        {goals.map((goal) => (
          <DashboardGoalRow key={goal.id} goal={goal} />
        ))}
      </div>

      {/* Empty state */}
      {goals.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
            <EmptyTitle>No active goals</EmptyTitle>
            <EmptyDescription>
              Set a goal to start tracking your progress.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/goals">
              <Button>
                <PlusIcon />
                <span>Set a goal</span>
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}

export { DashboardGoalsWidget, DashboardGoalRow };
