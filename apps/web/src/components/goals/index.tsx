import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame,
  MapPin,
  MoreHorizontal,
  Pause,
  Pencil,
  Plus,
  Repeat,
  Target,
  Timer,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockGoals: Goal[] = [
  {
    id: "1",
    goalType: "distance",
    cadence: "weekly",
    targetValue: 30,
    currentValue: 22.4,
    trackStreak: true,
    currentStreak: 5,
    bestStreak: 8,
    status: "on-track",
    createdAt: "2026-01-15",
    resetsAt: "2026-03-02",
  },
  {
    id: "2",
    goalType: "frequency",
    cadence: "weekly",
    targetValue: 4,
    currentValue: 2,
    trackStreak: true,
    currentStreak: 3,
    bestStreak: 12,
    status: "on-track",
    createdAt: "2026-02-01",
    resetsAt: "2026-03-02",
  },
  {
    id: "3",
    goalType: "pace",
    cadence: "monthly",
    targetValue: 5.3,
    currentValue: 5.52,
    trackStreak: false,
    currentStreak: 0,
    bestStreak: 0,
    status: "at-risk",
    createdAt: "2026-02-10",
    resetsAt: "2026-03-01",
  },
  {
    id: "4",
    goalType: "distance",
    cadence: "monthly",
    targetValue: 100,
    currentValue: 41.7,
    trackStreak: true,
    currentStreak: 0,
    bestStreak: 2,
    status: "behind",
    createdAt: "2026-01-01",
    resetsAt: "2026-03-01",
  },
  {
    id: "5",
    goalType: "frequency",
    cadence: "monthly",
    targetValue: 15,
    currentValue: 15,
    trackStreak: true,
    currentStreak: 4,
    bestStreak: 4,
    status: "completed",
    createdAt: "2026-01-20",
    resetsAt: "2026-03-01",
  },
];

// ── Config ───────────────────────────────────────────────────────────────────

const goalTypeConfig: Record<
  GoalType,
  {
    label: string;
    unit: string;
    icon: typeof MapPin;
    color: string;
    iconBg: string;
    iconColor: string;
    badgeBg: string;
  }
> = {
  distance: {
    label: "Distance",
    unit: "km",
    icon: MapPin,
    color: "emerald",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  frequency: {
    label: "Frequency",
    unit: "runs",
    icon: Repeat,
    color: "violet",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  pace: {
    label: "Pace",
    unit: "min/km",
    icon: Timer,
    color: "amber",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
};

const statusConfig: Record<
  GoalStatus,
  { label: string; color: string; icon: typeof TrendingUp }
> = {
  "on-track": {
    label: "On Track",
    color: "text-emerald-400",
    icon: TrendingUp,
  },
  "at-risk": {
    label: "At Risk",
    color: "text-amber-400",
    icon: TrendingDown,
  },
  behind: {
    label: "Behind",
    color: "text-red-400",
    icon: TrendingDown,
  },
  completed: {
    label: "Completed",
    color: "text-sky-400",
    icon: Target,
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function getProgressBarColor(status: GoalStatus): string {
  switch (status) {
    case "on-track":
      return "[&>div]:bg-emerald-500";
    case "at-risk":
      return "[&>div]:bg-amber-500";
    case "behind":
      return "[&>div]:bg-red-500";
    case "completed":
      return "[&>div]:bg-sky-500";
  }
}

// ── Components ───────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onCreateGoal,
}: {
  goal: Goal;
  onCreateGoal: () => void;
}) {
  const config = goalTypeConfig[goal.goalType];
  const status = statusConfig[goal.status];
  const Icon = config.icon;
  const StatusIcon = status.icon;
  const progress = getProgressPercent(goal);
  const daysLeft = getDaysUntilReset(goal.resetsAt);

  return (
    <Card className="group border-border bg-card hover:border-muted-foreground/20 relative overflow-hidden transition-colors">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              config.iconBg,
            )}
          >
            <Icon className={cn("h-5 w-5", config.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                {config.label} Goal
              </CardTitle>
              <Badge
                variant="outline"
                className="text-[10px] font-medium tracking-wider uppercase"
              >
                {goal.cadence}
              </Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <StatusIcon className={cn("h-3 w-3", status.color)} />
              <span className={cn("text-xs font-medium", status.color)}>
                {status.label}
              </span>
              {goal.status !== "completed" && (
                <span className="text-muted-foreground text-xs">
                  · {daysLeft}d left
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit Goal
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pause className="mr-2 h-3.5 w-3.5" />
              Pause Goal
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-400 focus:text-red-400">
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Goal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Big number */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tracking-tight">
            {formatValue(goal.currentValue, goal.goalType)}
          </span>
          <span className="text-muted-foreground text-sm">
            / {formatValue(goal.targetValue, goal.goalType)}
          </span>
          <span className="text-muted-foreground text-xs">{config.unit}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <Progress
            value={progress}
            className={cn("bg-muted h-2", getProgressBarColor(goal.status))}
          />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">
              {Math.round(progress)}% complete
            </span>
            {goal.goalType !== "pace" && (
              <span className="text-muted-foreground text-xs">
                {formatValue(
                  goal.targetValue - goal.currentValue,
                  goal.goalType,
                )}{" "}
                {config.unit} to go
              </span>
            )}
            {goal.goalType === "pace" &&
              goal.currentValue > goal.targetValue && (
                <span className="text-muted-foreground text-xs">
                  {formatValue(
                    goal.currentValue - goal.targetValue,
                    goal.goalType,
                  )}{" "}
                  min/km to shave
                </span>
              )}
          </div>
        </div>

        {/* Streak */}
        {goal.trackStreak && (
          <div className="border-border bg-muted/30 flex items-center justify-between rounded-lg border px-3 py-2">
            <div className="flex items-center gap-2">
              <Flame
                className={cn(
                  "h-4 w-4",
                  goal.currentStreak > 0
                    ? "text-orange-400"
                    : "text-muted-foreground",
                )}
              />
              <span className="text-sm font-medium">
                {goal.currentStreak > 0 ? (
                  <>
                    {goal.currentStreak}{" "}
                    {goal.cadence === "weekly" ? "week" : "month"} streak
                  </>
                ) : (
                  "No active streak"
                )}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              Best: {goal.bestStreak}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onCreateGoal }: { onCreateGoal: () => void }) {
  return (
    <div className="border-border flex flex-col items-center justify-center rounded-xl border border-dashed py-20">
      <div className="bg-muted mb-4 flex h-14 w-14 items-center justify-center rounded-full">
        <Target className="text-muted-foreground h-7 w-7" />
      </div>
      <h3 className="text-foreground mb-1 font-semibold">No goals yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
        Set a distance, frequency, or pace goal to stay accountable and track
        your progress over time.
      </p>
      <Button onClick={onCreateGoal}>
        <Plus className="mr-2 h-4 w-4" />
        Create Your First Goal
      </Button>
    </div>
  );
}

function StatsBar({ goals }: { goals: Goal[] }) {
  const active = goals.filter((g) => g.status !== "completed").length;
  const completed = goals.filter((g) => g.status === "completed").length;
  const longestStreak = Math.max(...goals.map((g) => g.bestStreak), 0);
  const onTrack = goals.filter((g) => g.status === "on-track").length;

  const stats = [
    { label: "Active Goals", value: active },
    { label: "Completed", value: completed },
    { label: "On Track", value: onTrack },
    { label: "Best Streak", value: `${longestStreak}w` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-border bg-card rounded-lg border px-4 py-3"
        >
          <p className="text-muted-foreground text-xs">{stat.label}</p>
          <p className="text-xl font-bold tracking-tight">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const [goals] = useState<Goal[]>(mockGoals);

  const handleCreateGoal = () => {
    // Open your wizard here — modal, drawer, or navigate to /goals/new
    console.log("Open create goal wizard");
  };

  const activeGoals = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground text-sm">
              Track your running targets and build consistency.
            </p>
          </div>
          <Button onClick={handleCreateGoal}>
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </div>

        {goals.length === 0 ? (
          <EmptyState onCreateGoal={handleCreateGoal} />
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <StatsBar goals={goals} />

            {/* Tabs */}
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active
                  {activeGoals.length > 0 && (
                    <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      {activeGoals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed
                  {completedGoals.length > 0 && (
                    <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      {completedGoals.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-6">
                {activeGoals.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    No active goals. Create one to get started.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {activeGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onCreateGoal={handleCreateGoal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                {completedGoals.length === 0 ? (
                  <div className="text-muted-foreground py-12 text-center text-sm">
                    No completed goals yet. Keep pushing!
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {completedGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        onCreateGoal={handleCreateGoal}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onCreateGoal={handleCreateGoal}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
