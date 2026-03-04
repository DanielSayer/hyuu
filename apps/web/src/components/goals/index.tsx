import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/utils";
import { queryClient, trpc, trpcClient, type TRPCResult } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CreateGoalWizard } from "./create-goal-wizard";
import { GoalCard } from "./goal-card";

// ── Types ────────────────────────────────────────────────────────────────────

type GoalType = "distance" | "frequency" | "pace";
type GoalCadence = "weekly" | "monthly";
type GoalStatus = "on-track" | "at-risk" | "behind" | "completed";

interface Goal {
  id: number;
  goalType: GoalType;
  cadence: GoalCadence;
  targetValue: number;
  currentValue: number;
  trackStreak: boolean;
  currentStreak: number;
  bestStreak: number;
  status: GoalStatus;
  resetsAt: string;
}

type GoalsListResult = TRPCResult<typeof trpc.goals.list.queryOptions>;
type ApiGoal = GoalsListResult["goals"][number];

function EmptyState() {
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
      <CreateGoalWizard />
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
    { label: "Best Streak", value: `${longestStreak} weeks` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card>
          <CardHeader>
            <CardTitle>{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold tracking-tight">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

function getGoalStatus(goal: ApiGoal): GoalStatus {
  if (goal.completedAt) {
    return "completed";
  }
  const ratio = Math.max(0, Math.min(1, goal.progressRatio));
  if (ratio < 0.4) {
    return "behind";
  }
  if (ratio < 0.8) {
    return "at-risk";
  }
  return "on-track";
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function computeResetsAt(goal: ApiGoal, weekStart: Date | string) {
  if (goal.cadence === "weekly") {
    const date = toDate(weekStart);
    date.setUTCDate(date.getUTCDate() + 7);
    return date.toISOString();
  }
  const now = new Date();
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return nextMonth.toISOString();
}

function mapGoals(data: GoalsListResult | undefined): Goal[] {
  if (!data) {
    return [];
  }
  return data.goals.map((goal) => {
    const currentStreak = goal.streak?.currentWeeks ?? 0;
    return {
      id: goal.id,
      goalType: goal.goalType,
      cadence: goal.cadence,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      trackStreak: goal.streak !== null,
      currentStreak,
      bestStreak: currentStreak,
      status: getGoalStatus(goal),
      resetsAt: computeResetsAt(goal, data.weekStart),
    };
  });
}

function validateTargetValue(goalType: GoalType, targetValueRaw: string): number {
  const targetValue = Number(targetValueRaw);
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    throw new Error("Target must be a positive number.");
  }
  if (goalType === "frequency" && !Number.isInteger(targetValue)) {
    throw new Error("Frequency target must be a whole number.");
  }
  return targetValue;
}

export function GoalsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [targetValueRaw, setTargetValueRaw] = useState("");
  const { data, isLoading, error } = useQuery(trpc.goals.list.queryOptions());
  const goals = useMemo(() => mapGoals(data), [data]);

  const updateGoalMutation = useMutation({
    mutationFn: (input: { id: number; targetValue: number }) =>
      trpcClient.goals.update.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.goals.list.queryOptions());
      toast.success("Goal updated.");
      setDialogOpen(false);
      setEditingGoal(null);
      setTargetValueRaw("");
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, "Failed to update goal."));
    },
  });

  const archiveGoalMutation = useMutation({
    mutationFn: (input: { id: number }) => trpcClient.goals.archive.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.goals.list.queryOptions());
      toast.success("Goal archived.");
    },
    onError: (mutationError) => {
      toast.error(getErrorMessage(mutationError, "Failed to archive goal."));
    },
  });

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setTargetValueRaw(String(goal.targetValue));
    setDialogOpen(true);
  };

  const handleSubmitEdit = () => {
    if (!editingGoal) {
      return;
    }
    try {
      const targetValue = validateTargetValue(editingGoal.goalType, targetValueRaw);
      updateGoalMutation.mutate({
        id: editingGoal.id,
        targetValue,
      });
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Invalid goal target."));
    }
  };

  const activeGoals = goals.filter((g) => g.status !== "completed");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
            <p className="text-muted-foreground text-sm">
              Track your running targets and build consistency.
            </p>
          </div>
          <CreateGoalWizard />
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            Loading goals...
          </div>
        ) : error ? (
          <div className="text-muted-foreground py-12 text-center text-sm">
            {getErrorMessage(error, "Failed to load goals.")}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState />
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
                    <span className="bg-primary/20 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
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
                        onEdit={() => handleEditGoal(goal)}
                        onArchive={() => archiveGoalMutation.mutate({ id: goal.id })}
                        isArchiving={archiveGoalMutation.isPending}
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
                        onEdit={() => handleEditGoal(goal)}
                        onArchive={() => archiveGoalMutation.mutate({ id: goal.id })}
                        isArchiving={archiveGoalMutation.isPending}
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
                      onEdit={() => handleEditGoal(goal)}
                      onArchive={() => archiveGoalMutation.mutate({ id: goal.id })}
                      isArchiving={archiveGoalMutation.isPending}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
            <DialogDescription>Update your target value.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="goal-target">Target value</Label>
            <Input
              id="goal-target"
              inputMode="decimal"
              value={targetValueRaw}
              onChange={(event) => setTargetValueRaw(event.target.value)}
              placeholder="e.g. 30, 4, 5.3"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updateGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updateGoalMutation.isPending || targetValueRaw.length === 0}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
