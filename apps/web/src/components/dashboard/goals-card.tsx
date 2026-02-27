import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { GoalRow, goalTypeLabel } from "@/components/dashboard/goal-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/utils";
import { queryClient, trpc, trpcClient, type TRPCResult } from "@/utils/trpc";

type DashboardGoal = TRPCResult<typeof trpc.dashboard.queryOptions>["goals"][number];
type GoalType = DashboardGoal["goalType"];

const GOAL_TYPE_OPTIONS: Array<{ value: GoalType; label: string }> = [
  { value: "distance", label: "Distance (meters)" },
  { value: "activity_count", label: "Activity count (runs)" },
  { value: "time", label: "Duration (seconds)" },
  { value: "streak", label: "Streak (days per week)" },
];

function validateTargetValue(goalType: GoalType, targetValueRaw: string): number {
  const targetValue = Number(targetValueRaw);
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    throw new Error("Target must be a positive number.");
  }
  if ((goalType === "activity_count" || goalType === "streak") && !Number.isInteger(targetValue)) {
    throw new Error("Count and streak targets must be whole numbers.");
  }
  if (goalType === "streak" && (targetValue < 1 || targetValue > 7)) {
    throw new Error("Streak target must be between 1 and 7.");
  }
  return targetValue;
}

function GoalsCard({ goals }: { goals: DashboardGoal[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DashboardGoal | null>(null);
  const [goalType, setGoalType] = useState<GoalType>("distance");
  const [targetValueRaw, setTargetValueRaw] = useState("");

  const createGoalMutation = useMutation({
    mutationFn: (input: { goalType: GoalType; targetValue: number }) =>
      trpcClient.goals.create.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.dashboard.queryOptions());
      toast.success("Goal created.");
      setDialogOpen(false);
      setTargetValueRaw("");
      setEditingGoal(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to create goal."));
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: (input: { id: number; targetValue: number }) =>
      trpcClient.goals.update.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.dashboard.queryOptions());
      toast.success("Goal updated.");
      setDialogOpen(false);
      setTargetValueRaw("");
      setEditingGoal(null);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to update goal."));
    },
  });

  const archiveGoalMutation = useMutation({
    mutationFn: (input: { id: number }) => trpcClient.goals.archive.mutate(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.dashboard.queryOptions());
      toast.success("Goal archived.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Failed to archive goal."));
    },
  });

  const handleCreate = () => {
    setEditingGoal(null);
    setGoalType("distance");
    setTargetValueRaw("");
    setDialogOpen(true);
  };

  const handleEdit = (goal: DashboardGoal) => {
    setEditingGoal(goal);
    setGoalType(goal.goalType);
    setTargetValueRaw(String(goal.targetValue));
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    try {
      const targetValue = validateTargetValue(goalType, targetValueRaw);
      if (editingGoal) {
        updateGoalMutation.mutate({
          id: editingGoal.id,
          targetValue,
        });
      } else {
        createGoalMutation.mutate({
          goalType,
          targetValue,
        });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid goal target."));
    }
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Goals</CardTitle>
          <Button size="sm" variant="outline" onClick={handleCreate}>
            Add goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {goals.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No goals yet. Add one to start tracking.
            </p>
          ) : (
            goals.map((goal) => (
              <GoalRow
                key={goal.id}
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onArchive={() => archiveGoalMutation.mutate({ id: goal.id })}
                isArchiving={archiveGoalMutation.isPending}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Edit goal" : "Create goal"}</DialogTitle>
            <DialogDescription>
              {editingGoal
                ? `Update your ${goalTypeLabel(editingGoal.goalType).toLowerCase()} target.`
                : "Choose goal type and weekly target."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="goal-type">Goal type</Label>
              <Select
                items={GOAL_TYPE_OPTIONS}
                value={goalType}
                onValueChange={(value) => {
                  if (value) {
                    setGoalType(value as GoalType);
                  }
                }}
                disabled={!!editingGoal}
              >
                <SelectTrigger id="goal-type" className="w-full">
                  <SelectValue placeholder="Select a goal type" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="goal-target">Target value</Label>
              <Input
                id="goal-target"
                inputMode="decimal"
                value={targetValueRaw}
                onChange={(event) => setTargetValueRaw(event.target.value)}
                placeholder="e.g. 30000, 4, 7200, 3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createGoalMutation.isPending || updateGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createGoalMutation.isPending ||
                updateGoalMutation.isPending ||
                targetValueRaw.length === 0
              }
            >
              {editingGoal ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { GoalsCard };
