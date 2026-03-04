import { motion } from "motion/react";
import { ArrowRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CadenceOption, GoalTypeOption } from "./constants";
import type { GoalCadence, GoalFormState } from "./types";

interface StepCadenceTargetProps {
  selectedGoal: GoalTypeOption;
  cadenceOptions: readonly CadenceOption[];
  form: GoalFormState;
  canProceed: boolean;
  onSelectCadence: (cadence: GoalCadence) => void;
  onTargetValueChange: (value: string) => void;
  onTrackStreakChange: (checked: boolean) => void;
  onContinue: () => void;
}

export function StepCadenceTarget({
  selectedGoal,
  cadenceOptions,
  form,
  canProceed,
  onSelectCadence,
  onTargetValueChange,
  onTrackStreakChange,
  onContinue,
}: StepCadenceTargetProps) {
  return (
    <motion.div
      key="step-1"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className={selectedGoal.badgeColor}>
            {selectedGoal.title}
          </Badge>
        </div>
        <h2 className="text-foreground text-lg font-semibold">
          Set your target
        </h2>
        <p className="text-muted-foreground text-sm">How often and how much?</p>
      </div>

      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm font-medium">
          Cadence
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {cadenceOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = form.cadence === option.value;

            return (
              <button
                key={option.value}
                onClick={() => onSelectCadence(option.value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-muted-foreground/30",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isSelected ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-foreground font-medium">
                      {option.label}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <Label
          htmlFor="targetValue"
          className="text-muted-foreground text-sm font-medium"
        >
          Target
        </Label>
        <div className="relative">
          <Input
            id="targetValue"
            type="number"
            step={selectedGoal.type === "pace" ? "0.01" : "1"}
            min="0"
            placeholder={selectedGoal.placeholder}
            value={form.targetValue}
            onChange={(e) => onTargetValueChange(e.target.value)}
            className="h-14 rounded-xl pr-16 text-lg font-semibold"
          />
          <span className="text-muted-foreground absolute top-1/2 right-4 -translate-y-1/2 text-sm font-medium">
            {selectedGoal.unit}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          {selectedGoal.hint}
          {form.cadence
            ? ` per ${form.cadence === "weekly" ? "week" : "month"}`
            : ""}
        </p>
      </div>

      {selectedGoal.type === "frequency" && (
        <div className="border-border bg-card flex items-center justify-between rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-foreground font-medium">Track streak</p>
              <p className="text-muted-foreground text-xs">
                Keep a streak count when you hit your goal consecutively
              </p>
            </div>
          </div>
          <Switch
            checked={form.trackStreak}
            onCheckedChange={onTrackStreakChange}
          />
        </div>
      )}

      <div className="pt-4">
        <Button
          className="w-full"
          size="lg"
          disabled={!canProceed}
          onClick={onContinue}
        >
          Review Goal
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
