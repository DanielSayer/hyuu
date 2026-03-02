import { motion } from "motion/react";
import { Check, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GoalFormState } from "./types";
import type { GoalTypeOption } from "./constants";

interface StepReviewProps {
  selectedGoal: GoalTypeOption;
  form: GoalFormState;
  onEdit: () => void;
  onSubmit: () => void;
}

export function StepReview({
  selectedGoal,
  form,
  onEdit,
  onSubmit,
}: StepReviewProps) {
  return (
    <motion.div
      key="step-2"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-foreground text-lg font-semibold">
          Looking good — confirm your goal
        </h2>
        <p className="text-muted-foreground text-sm">
          Here&apos;s what you&apos;re committing to. Ready?
        </p>
      </div>

      <Card className="border-border overflow-hidden">
        <div
          className={cn(
            "h-2 bg-linear-to-r",
            selectedGoal.type === "distance" && "from-emerald-500 to-teal-500",
            selectedGoal.type === "frequency" && "from-violet-500 to-purple-500",
            selectedGoal.type === "pace" && "from-amber-500 to-orange-500",
          )}
        />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                selectedGoal.badgeColor,
              )}
            >
              <selectedGoal.icon className={cn("h-5 w-5", selectedGoal.iconColor)} />
            </div>
            <div>
              <CardTitle className="text-base">{selectedGoal.title}</CardTitle>
              <CardDescription>
                {form.cadence === "weekly" ? "Weekly" : "Monthly"} target
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-foreground text-4xl font-bold tracking-tight">
              {form.targetValue}
            </span>
            <span className="text-muted-foreground text-lg">{selectedGoal.unit}</span>
            <span className="text-muted-foreground text-sm">
              / {form.cadence === "weekly" ? "week" : "month"}
            </span>
          </div>

          {form.trackStreak && (
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <Flame className="h-4 w-4" />
              Streak tracking enabled
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" size="lg" className="flex-1" onClick={onEdit}>
          Edit
        </Button>
        <Button size="lg" className="flex-1" onClick={onSubmit}>
          <Check className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>
    </motion.div>
  );
}
