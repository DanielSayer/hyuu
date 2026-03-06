import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDays, getGoalOption, getGoalSummary, getWeekdayLabel } from "./utils";
import type { TrainingPlanFormState } from "./types";

interface StepReviewProps {
  form: TrainingPlanFormState;
  onEditGoal: () => void;
  onEditSchedule: () => void;
  onEditContext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function StepReview({
  form,
  onEditGoal,
  onEditSchedule,
  onEditContext,
  onSubmit,
  isSubmitting,
}: StepReviewProps) {
  const goal = getGoalOption(form.goalType);

  return (
    <motion.div
      key="training-plan-review-step"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Review your scaffold inputs</h3>
        <p className="text-muted-foreground text-sm">
          Final submit creates the training-plan scaffold row. It does not
          generate workouts yet.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {goal && (
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${goal.badgeColor}`}
                >
                  <goal.icon className={`h-5 w-5 ${goal.iconColor}`} />
                </div>
              )}
              <div>
                <CardTitle>Goal</CardTitle>
                <CardDescription>{getGoalSummary(form)}</CardDescription>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onEditGoal}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Goal type" value={goal?.title ?? "Not set"} />
          {form.targetDistanceKm && (
            <DetailRow label="Target distance" value={`${form.targetDistanceKm} km`} />
          )}
          {form.eventDate && <DetailRow label="Event date" value={form.eventDate} />}
          {form.targetDate && (
            <DetailRow label="Target date" value={form.targetDate} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>{form.startDate}</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEditSchedule}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow label="Start date" value={form.startDate} />
          <DetailRow
            label="Horizon"
            value={`${form.planningHorizonWeeks || "12"} weeks`}
          />
          <DetailRow
            label="Runs per week"
            value={form.defaultRunsPerWeek || "Not set"}
          />
          <DetailRow
            label="Preferred days"
            value={formatDays(form.preferredRunDays)}
          />
          <DetailRow label="Blocked days" value={formatDays(form.blockedDays)} />
          <DetailRow
            label="Long run day"
            value={
              form.longRunDay ? getWeekdayLabel(Number(form.longRunDay)) : "Not set"
            }
          />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Context</CardTitle>
              <CardDescription>Runner profile and constraints</CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onEditContext}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <DetailRow
            label="Experience"
            value={form.experienceLevel?.replace("_", " ") ?? "Not set"}
          />
          <DetailRow
            label="Motivation"
            value={form.primaryMotivation?.replace("_", " ") ?? "Not set"}
          />
          <DetailRow
            label="Weekly runs"
            value={form.typicalWeeklyRuns || "Not set"}
          />
          <DetailRow
            label="Weekly distance"
            value={
              form.typicalWeeklyDistanceKm
                ? `${form.typicalWeeklyDistanceKm} km`
                : "Not set"
            }
          />
          <DetailRow
            label="Longest recent run"
            value={
              form.longestRecentRunKm ? `${form.longestRecentRunKm} km` : "Not set"
            }
          />
          <div className="flex flex-wrap gap-2 pt-2">
            {form.planEffortPreference && (
              <Badge variant="outline">{form.planEffortPreference}</Badge>
            )}
            {form.willingForSpeedwork && <Badge variant="outline">Speedwork</Badge>}
            {form.willingForHills && <Badge variant="outline">Hills</Badge>}
            {form.willingForCrossTraining && (
              <Badge variant="outline">Cross-training</Badge>
            )}
            {!form.planEffortPreference &&
              !form.willingForSpeedwork &&
              !form.willingForHills &&
              !form.willingForCrossTraining && (
                <span className="text-muted-foreground text-sm">No extras set</span>
              )}
          </div>
        </CardContent>
      </Card>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
        onClick={onSubmit}
      >
        <Check className="mr-2 h-4 w-4" />
        Create Training Plan Scaffold
      </Button>
    </motion.div>
  );
}
