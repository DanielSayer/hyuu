import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  constraintOptions,
  effortPreferenceOptions,
  experienceLevelOptions,
  motivationOptions,
} from "./constants";
import type {
  TrainingPlanEffortPreference,
  TrainingPlanExperienceLevel,
  TrainingPlanFormState,
  TrainingPlanMotivation,
} from "./types";

interface StepContextProps {
  form: TrainingPlanFormState;
  canProceed: boolean;
  hasTrustedHistory: boolean;
  onFieldChange: (
    field:
      | "typicalWeeklyRuns"
      | "typicalWeeklyDistanceKm"
      | "longestRecentRunKm",
    value: string,
  ) => void;
  onExperienceLevelChange: (value: TrainingPlanExperienceLevel) => void;
  onMotivationChange: (value: TrainingPlanMotivation) => void;
  onEffortPreferenceChange: (value: TrainingPlanEffortPreference) => void;
  onConstraintChange: (
    field:
      | "willingForSpeedwork"
      | "willingForHills"
      | "willingForCrossTraining",
    value: boolean,
  ) => void;
  onContinue: () => void;
  isSaving: boolean;
}

export function StepContext({
  form,
  canProceed,
  hasTrustedHistory,
  onFieldChange,
  onExperienceLevelChange,
  onMotivationChange,
  onEffortPreferenceChange,
  onConstraintChange,
  onContinue,
  isSaving,
}: StepContextProps) {
  return (
    <motion.div
      key="training-plan-context-step"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Add a little context</h3>
        <p className="text-muted-foreground text-sm">
          Keep this light. We just want enough profile and constraint data to
          create a solid scaffold.
        </p>
      </div>

      {hasTrustedHistory && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium">We found synced running history.</p>
          <p className="text-muted-foreground mt-1">
            These fields were prefilled where possible. Adjust anything that
            looks off.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Experience level</Label>
          <Select
            value={form.experienceLevel ?? ""}
            onValueChange={(value) => {
              if (value) {
                onExperienceLevelChange(value as TrainingPlanExperienceLevel);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {experienceLevelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Primary motivation</Label>
          <Select
            value={form.primaryMotivation ?? ""}
            onValueChange={(value) => {
              if (value) {
                onMotivationChange(value as TrainingPlanMotivation);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select motivation" />
            </SelectTrigger>
            <SelectContent>
              {motivationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="typicalWeeklyRuns">Typical weekly runs</Label>
          <Input
            id="typicalWeeklyRuns"
            type="number"
            min="0"
            max="14"
            step="1"
            value={form.typicalWeeklyRuns}
            onChange={(event) =>
              onFieldChange("typicalWeeklyRuns", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="typicalWeeklyDistanceKm">Typical weekly distance (km)</Label>
          <Input
            id="typicalWeeklyDistanceKm"
            type="number"
            min="0"
            max="500"
            step="0.1"
            value={form.typicalWeeklyDistanceKm}
            onChange={(event) =>
              onFieldChange("typicalWeeklyDistanceKm", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longestRecentRunKm">Longest recent run (km)</Label>
          <Input
            id="longestRecentRunKm"
            type="number"
            min="0"
            max="200"
            step="0.1"
            value={form.longestRecentRunKm}
            onChange={(event) =>
              onFieldChange("longestRecentRunKm", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Plan effort</Label>
          <Select
            value={form.planEffortPreference ?? ""}
            onValueChange={(value) => {
              if (value) {
                onEffortPreferenceChange(value as TrainingPlanEffortPreference);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select effort" />
            </SelectTrigger>
            <SelectContent>
              {effortPreferenceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h4 className="font-medium">Constraints</h4>
          <p className="text-muted-foreground text-sm">
            Keep this binary for now. You can make the plan conservative later.
          </p>
        </div>

        <div className="space-y-3">
          {constraintOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-start gap-3 rounded-lg border border-border p-3"
            >
              <Checkbox
                checked={form[option.key]}
                onCheckedChange={(checked) =>
                  onConstraintChange(option.key, Boolean(checked))
                }
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <option.icon className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">{option.title}</span>
                </div>
                <p className="text-muted-foreground text-sm">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canProceed || isSaving}
        onClick={onContinue}
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
