import { motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoalTypeOption } from "./constants";
import type { GoalType } from "./types";

interface StepGoalTypeProps {
  goalTypes: readonly GoalTypeOption[];
  selectedType: GoalType | null;
  canProceed: boolean;
  onSelectType: (type: GoalType) => void;
  onContinue: () => void;
}

export function StepGoalType({
  goalTypes,
  selectedType,
  canProceed,
  onSelectType,
  onContinue,
}: StepGoalTypeProps) {
  return (
    <motion.div
      key="step-0"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="mb-6">
        <h2 className="text-foreground text-lg font-semibold">
          What do you want to achieve?
        </h2>
        <p className="text-muted-foreground text-sm">
          Pick a goal type that matches your focus right now.
        </p>
      </div>

      <div className="space-y-3">
        {goalTypes.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selectedType === goal.type;

          return (
            <button
              key={goal.type}
              onClick={() => onSelectType(goal.type)}
              className={cn(
                "group relative w-full overflow-hidden rounded-xl border p-5 text-left transition-all duration-200",
                isSelected
                  ? `${goal.activeBorder} bg-linear-to-br ${goal.gradient}`
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/50",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-foreground font-semibold">{goal.title}</h3>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="text-primary h-4 w-4" />
                      </motion.div>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{goal.description}</p>
                </div>
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected ? goal.badgeColor : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      isSelected ? goal.iconColor : "text-muted-foreground",
                    )}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        <Button className="w-full" size="lg" disabled={!canProceed} onClick={onContinue}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
