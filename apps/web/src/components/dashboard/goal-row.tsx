import { Button } from "@/components/ui/button";
import { formatDistanceToKm } from "@hyuu/utils/distance";
import { formatSecondsToHms } from "@hyuu/utils/time";
import { PencilIcon, Trash2Icon } from "lucide-react";

type GoalType = "distance" | "frequency" | "pace";

type GoalRowProps = {
  goal: {
    id: number;
    goalType: GoalType;
    targetValue: number;
    currentValue: number;
    progressRatio: number;
    completedAt: string | Date | null;
  };
  onEdit: () => void;
  onArchive: () => void;
  isArchiving: boolean;
};

function goalTypeLabel(goalType: GoalType) {
  if (goalType === "distance") return "Distance";
  if (goalType === "frequency") return "Runs";
  return "Pace";
}

function formatGoalValue(goalType: GoalType, value: number) {
  if (goalType === "distance") {
    return formatDistanceToKm(value);
  }
  if (goalType === "frequency") {
    return `${Math.round(value)} runs`;
  }
  return formatSecondsToHms(value * 60);
}

function GoalRow({ goal, onEdit, onArchive, isArchiving }: GoalRowProps) {
  const progressPercent = Math.max(0, Math.min(goal.progressRatio, 1)) * 100;
  const overachievedBy = Math.max(0, goal.currentValue - goal.targetValue);
  const isComplete = goal.completedAt !== null;

  return (
    <div className="bg-accent/20 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{goalTypeLabel(goal.goalType)}</p>
          <p className="text-muted-foreground text-xs">
            {formatGoalValue(goal.goalType, goal.currentValue)} /{" "}
            {formatGoalValue(goal.goalType, goal.targetValue)}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <PencilIcon />
            <span className="sr-only">Edit goal</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onArchive}
            disabled={isArchiving}
          >
            <Trash2Icon />
            <span className="sr-only">Archive goal</span>
          </Button>
        </div>
      </div>

      <div className="bg-muted mt-3 h-2 w-full overflow-hidden rounded-full">
        <div
          className={`h-2 rounded-full ${isComplete ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {isComplete
          ? overachievedBy > 0
            ? `Complete (+${formatGoalValue(goal.goalType, overachievedBy)})`
            : "Complete"
          : `${Math.round(progressPercent)}% complete`}
      </p>
    </div>
  );
}

export { GoalRow, goalTypeLabel };
