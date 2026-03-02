import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoalCadence } from "./types";
import type { GoalTypeOption } from "./constants";

interface StepSuccessProps {
  selectedGoal: GoalTypeOption;
  targetValue: string;
  cadence: GoalCadence;
  onReset: () => void;
}

export function StepSuccess({
  selectedGoal,
  targetValue,
  cadence,
  onReset,
}: StepSuccessProps) {
  return (
    <motion.div
      key="step-3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center py-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.15,
        }}
        className={cn(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-full",
          selectedGoal.type === "distance" && "bg-emerald-500/10",
          selectedGoal.type === "frequency" && "bg-violet-500/10",
          selectedGoal.type === "pace" && "bg-amber-500/10",
        )}
      >
        <Check className={cn("h-10 w-10", selectedGoal.iconColor)} strokeWidth={2.5} />
      </motion.div>

      <h2 className="text-foreground mb-2 text-2xl font-bold">Goal created!</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        You&apos;re targeting{" "}
        <span className="text-foreground font-semibold">
          {targetValue} {selectedGoal.unit}
        </span>{" "}
        every {cadence === "weekly" ? "week" : "month"}. Let&apos;s get after it.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          Create Another
        </Button>
        <Button>View My Goals</Button>
      </div>
    </motion.div>
  );
}
