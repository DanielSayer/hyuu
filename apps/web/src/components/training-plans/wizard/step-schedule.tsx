import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { weekDayOptions } from "./constants";
import { getWeekdayLabel } from "./utils";
import { WeekdaySelector } from "./weekday-selector";
import type { TrainingPlanFormState } from "./types";

interface StepScheduleProps {
  form: TrainingPlanFormState;
  canProceed: boolean;
  onFieldChange: (
    field: "startDate" | "planningHorizonWeeks" | "defaultRunsPerWeek" | "longRunDay",
    value: string,
  ) => void;
  onPreferredRunDaysChange: (value: number[]) => void;
  onBlockedDaysChange: (value: number[]) => void;
  onContinue: () => void;
  isSaving: boolean;
}

export function StepSchedule({
  form,
  canProceed,
  onFieldChange,
  onPreferredRunDaysChange,
  onBlockedDaysChange,
  onContinue,
  isSaving,
}: StepScheduleProps) {
  return (
    <motion.div
      key="training-plan-schedule-step"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">When should this plan run?</h3>
        <p className="text-muted-foreground text-sm">
          Pick the rough schedule. The backend can refine later.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <DatePickerInput
            id="startDate"
            value={form.startDate}
            onChange={(value) => onFieldChange("startDate", value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="planningHorizonWeeks">Planning horizon (weeks)</Label>
          <Input
            id="planningHorizonWeeks"
            type="number"
            min="1"
            max="104"
            step="1"
            value={form.planningHorizonWeeks}
            onChange={(event) =>
              onFieldChange("planningHorizonWeeks", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="defaultRunsPerWeek">Runs per week</Label>
          <Input
            id="defaultRunsPerWeek"
            type="number"
            min="1"
            max="14"
            step="1"
            value={form.defaultRunsPerWeek}
            onChange={(event) =>
              onFieldChange("defaultRunsPerWeek", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Long run day</Label>
          <Select
            value={form.longRunDay}
            onValueChange={(value) => onFieldChange("longRunDay", value ?? "")}
          >
            <SelectTrigger className="w-full">
              <span
                className={cn(
                  "flex flex-1 text-left text-sm",
                  !form.longRunDay && "text-muted-foreground",
                )}
              >
                {form.longRunDay !== ""
                  ? getWeekdayLabel(Number(form.longRunDay))
                  : "Pick a day"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {weekDayOptions.map((day) => (
                <SelectItem key={day.value} value={String(day.value)}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h4 className="font-medium">Preferred run days</h4>
          <p className="text-muted-foreground text-sm">
            Choose the days you usually want available for running.
          </p>
        </div>
        <WeekdaySelector
          value={form.preferredRunDays}
          onChange={onPreferredRunDaysChange}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h4 className="font-medium">Blocked days</h4>
          <p className="text-muted-foreground text-sm">
            Mark days that should generally stay free from runs.
          </p>
        </div>
        <WeekdaySelector value={form.blockedDays} onChange={onBlockedDaysChange} />
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
