import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RunningPlanScaffoldSummary } from "./types";
import { getGoalSummary } from "./utils";
import type { TrainingPlanFormState } from "./types";

interface StepSuccessProps {
  form: TrainingPlanFormState;
  scaffold: RunningPlanScaffoldSummary | null;
  onReset: () => void;
}

export function StepSuccess({
  form,
  scaffold,
  onReset,
}: StepSuccessProps) {
  return (
    <motion.div
      key="training-plan-success-step"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-12 text-center"
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
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
      >
        <Check className="text-primary h-10 w-10" strokeWidth={2.5} />
      </motion.div>

      <h3 className="text-2xl font-semibold tracking-tight">Scaffold created</h3>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">
        The training-plan scaffold now exists in the database for{" "}
        <span className="text-foreground font-medium">{getGoalSummary(form)}</span>.
        Workout generation still comes later.
      </p>

      {scaffold && (
        <div className="mt-6 rounded-xl border border-border bg-background px-4 py-3 text-sm">
          <p>
            Scaffold #{scaffold.id} is currently{" "}
            <span className="font-medium">{scaffold.status}</span>.
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        <Button type="button" variant="outline" onClick={onReset}>
          Start another
        </Button>
      </div>
    </motion.div>
  );
}
