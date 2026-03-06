import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trainingPlanGoalOptions } from "./constants";
import { getGoalOption } from "./utils";
import type { TrainingPlanFormState, TrainingPlanGoalType } from "./types";

interface StepGoalProps {
  form: TrainingPlanFormState;
  canProceed: boolean;
  onGoalTypeChange: (goalType: TrainingPlanGoalType) => void;
  onFieldChange: (
    field:
      | "targetDistanceKm"
      | "targetDate"
      | "raceName"
      | "eventDate"
      | "targetTimeMinutes",
    value: string,
  ) => void;
  onContinue: () => void;
}

export function StepGoal({
  form,
  canProceed,
  onGoalTypeChange,
  onFieldChange,
  onContinue,
}: StepGoalProps) {
  const selectedGoal = getGoalOption(form.goalType);

  return (
    <motion.div
      key="training-plan-goal-step"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">What kind of plan do you want?</h3>
        <p className="text-muted-foreground text-sm">
          Pick the shape first. We only collect enough context to create the
          scaffold row.
        </p>
      </div>

      <div className="space-y-3">
        {trainingPlanGoalOptions.map((goal) => {
          const selected = form.goalType === goal.type;

          return (
            <button
              key={goal.type}
              type="button"
              className={cn(
                "w-full rounded-xl border p-5 text-left transition-all duration-200",
                selected
                  ? `${goal.activeBorder} bg-linear-to-br ${goal.gradient}`
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40",
              )}
              onClick={() => onGoalTypeChange(goal.type)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{goal.title}</h4>
                    {selected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="text-primary h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {goal.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    selected ? goal.badgeColor : "bg-muted text-muted-foreground",
                  )}
                >
                  <goal.icon
                    className={cn("h-5 w-5", selected ? goal.iconColor : undefined)}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedGoal && (
        <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
          {(form.goalType === "distance" || form.goalType === "race") && (
            <div className="space-y-2">
              <Label htmlFor="targetDistanceKm">Target distance (km)</Label>
              <Input
                id="targetDistanceKm"
                type="number"
                min="1"
                step="0.1"
                placeholder="10"
                value={form.targetDistanceKm}
                onChange={(event) =>
                  onFieldChange("targetDistanceKm", event.target.value)
                }
              />
            </div>
          )}

          {form.goalType === "distance" && (
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target date</Label>
              <DatePickerInput
                id="targetDate"
                value={form.targetDate}
                onChange={(value) => onFieldChange("targetDate", value)}
              />
            </div>
          )}

          {form.goalType === "race" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="raceName">Race name</Label>
                <Input
                  id="raceName"
                  placeholder="Half Marathon"
                  value={form.raceName}
                  onChange={(event) => onFieldChange("raceName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event date</Label>
                <DatePickerInput
                  id="eventDate"
                  value={form.eventDate}
                  onChange={(value) => onFieldChange("eventDate", value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="targetTimeMinutes">Target time (minutes)</Label>
                <Input
                  id="targetTimeMinutes"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={form.targetTimeMinutes}
                  onChange={(event) =>
                    onFieldChange("targetTimeMinutes", event.target.value)
                  }
                />
              </div>
            </>
          )}

          {form.goalType === "general_fitness" && (
            <p className="text-muted-foreground text-sm md:col-span-2">
              No extra target needed. The scaffold will keep the goal broad and
              reusable.
            </p>
          )}

          {form.goalType === "consistency" && (
            <p className="text-muted-foreground text-sm md:col-span-2">
              We&apos;ll use your weekly schedule target in the next step to shape
              this plan.
            </p>
          )}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canProceed}
        onClick={onContinue}
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
