import {
  trainingPlanGoalOptions,
  weekDayOptions,
} from "./constants";
import type {
  RunningPlanDraft,
  RunningPlanPrefill,
  RunningPlanProfile,
  RunningPlanScaffoldSummary,
  TrainingPlanFormState,
  TrainingPlanGoalType,
} from "./types";

export const trainingPlanWizardVersion = 1;

export const wizardSteps = [
  "Goal",
  "Schedule",
  "Context",
  "Review",
] as const;

export const emptyTrainingPlanForm = (): TrainingPlanFormState => ({
  goalType: null,
  targetDistanceKm: "",
  targetDate: "",
  raceName: "",
  eventDate: "",
  targetTimeMinutes: "",
  startDate: getTodayDateInput(),
  planningHorizonWeeks: "12",
  defaultRunsPerWeek: "",
  preferredRunDays: [],
  blockedDays: [],
  longRunDay: "",
  experienceLevel: null,
  primaryMotivation: null,
  typicalWeeklyRuns: "",
  typicalWeeklyDistanceKm: "",
  longestRecentRunKm: "",
  planEffortPreference: null,
  willingForSpeedwork: false,
  willingForHills: false,
  willingForCrossTraining: false,
});

export function getTodayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function toOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function toOptionalInteger(value: string) {
  const parsed = toOptionalNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

export function toOptionalDay(value: string) {
  const parsed = toOptionalInteger(value);
  return parsed === undefined ? undefined : parsed;
}

export function toIsoDateTime(value: string) {
  return `${value}T00:00:00.000Z`;
}

export function fromIsoToDateInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const dateValue = typeof value === "string" ? value : value.toISOString();
  return dateValue.slice(0, 10);
}

export function sortDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b);
}

export function toggleDay(days: number[], day: number) {
  return days.includes(day)
    ? days.filter((value) => value !== day)
    : sortDays([...days, day]);
}

export function getWeekdayLabel(day: number) {
  return weekDayOptions.find((option) => option.value === Number(day))?.label ?? String(day);
}

export function formatDays(days: number[]) {
  if (days.length === 0) {
    return "None set";
  }
  return sortDays(days)
    .map(getWeekdayLabel)
    .join(", ");
}

export function getGoalOption(goalType: TrainingPlanGoalType | null) {
  return trainingPlanGoalOptions.find((option) => option.type === goalType) ?? null;
}

export function getGoalSummary(form: TrainingPlanFormState) {
  switch (form.goalType) {
    case "general_fitness":
      return "General fitness";
    case "consistency":
      return form.defaultRunsPerWeek
        ? `${form.defaultRunsPerWeek} runs per week`
        : "Consistency focus";
    case "distance":
      return form.targetDistanceKm
        ? `${form.targetDistanceKm} km target`
        : "Distance goal";
    case "race":
      return form.raceName.trim()
        ? form.raceName.trim()
        : form.targetDistanceKm
          ? `${form.targetDistanceKm} km race`
          : "Race goal";
    default:
      return "Not set";
  }
}

export function getScaffoldGoalSummary(scaffold: RunningPlanScaffoldSummary) {
  switch (scaffold.goalType) {
    case "general_fitness":
      return "General fitness";
    case "consistency":
      return "Consistency focus";
    case "distance":
      return "targetDistanceKm" in scaffold.goalDetails
        ? `${scaffold.goalDetails.targetDistanceKm} km target`
        : "Distance goal";
    case "race":
      if ("raceName" in scaffold.goalDetails && scaffold.goalDetails.raceName) {
        return scaffold.goalDetails.raceName;
      }
      return "targetDistanceKm" in scaffold.goalDetails
        ? `${scaffold.goalDetails.targetDistanceKm} km race`
        : "Race goal";
    default:
      return "Training plan";
  }
}

export function formatStatusLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStepIndexFromDraft(draft: RunningPlanDraft | null) {
  if (!draft) {
    return 0;
  }
  switch (draft.currentStep) {
    case "goal-intent":
      return 1;
    case "schedule":
      return 2;
    case "runner-profile":
    case "fitness-baseline":
    case "constraints":
    case "review-preferences":
      return 3;
    default:
      return 0;
  }
}

export function buildInitialForm(params: {
  draft: RunningPlanDraft | null;
  profile: RunningPlanProfile | null;
  prefill: RunningPlanPrefill | null;
}) {
  const { draft, profile, prefill } = params;
  const form = emptyTrainingPlanForm();
  const draftData = draft?.draftData;

  const goalIntent = draftData?.goalIntent;
  form.goalType = goalIntent?.goalType ?? null;
  if (goalIntent?.goalType === "distance") {
    form.targetDistanceKm = String(goalIntent.goalDetails.targetDistanceKm);
    form.targetDate = fromIsoToDateInput(goalIntent.goalDetails.targetDate);
  }
  if (goalIntent?.goalType === "race") {
    form.targetDistanceKm = String(goalIntent.goalDetails.targetDistanceKm);
    form.eventDate = fromIsoToDateInput(goalIntent.goalDetails.eventDate);
    form.raceName = goalIntent.goalDetails.raceName ?? "";
    form.targetTimeMinutes = goalIntent.goalDetails.targetTimeMinutes
      ? String(goalIntent.goalDetails.targetTimeMinutes)
      : "";
  }

  form.startDate =
    fromIsoToDateInput(draftData?.schedule?.startDate) || form.startDate;
  form.planningHorizonWeeks = draftData?.schedule?.planningHorizonWeeks
    ? String(draftData.schedule.planningHorizonWeeks)
    : form.planningHorizonWeeks;
  form.defaultRunsPerWeek = draftData?.schedule?.defaultRunsPerWeek
    ? String(draftData.schedule.defaultRunsPerWeek)
    : profile?.typicalWeeklyRuns
      ? String(profile.typicalWeeklyRuns)
      : prefill?.fitnessBaseline.currentWeeklyRuns
        ? String(prefill.fitnessBaseline.currentWeeklyRuns)
        : "";
  form.preferredRunDays =
    draftData?.schedule?.preferredRunDays ??
    draftData?.runnerProfile?.preferredRunDays ??
    profile?.preferredRunDays ??
    prefill?.schedule.preferredRunDays ??
    [];
  form.blockedDays =
    draftData?.schedule?.blockedDays ??
    draftData?.runnerProfile?.blockedDays ??
    profile?.blockedDays ??
    prefill?.schedule.blockedDays ??
    [];
  form.longRunDay = `${draftData?.schedule?.longRunDay ??
    draftData?.runnerProfile?.preferredLongRunDay ??
    profile?.preferredLongRunDay ??
    prefill?.schedule.longRunDay ??
    ""}`;

  form.experienceLevel =
    draftData?.runnerProfile?.experienceLevel ??
    profile?.experienceLevel ??
    null;
  form.primaryMotivation =
    draftData?.runnerProfile?.primaryMotivation ??
    profile?.primaryMotivation ??
    null;
  form.typicalWeeklyRuns = draftData?.runnerProfile?.typicalWeeklyRuns
    ? String(draftData.runnerProfile.typicalWeeklyRuns)
    : draftData?.fitnessBaseline?.currentWeeklyRuns
      ? String(draftData.fitnessBaseline.currentWeeklyRuns)
      : profile?.typicalWeeklyRuns
        ? String(profile.typicalWeeklyRuns)
        : prefill?.fitnessBaseline.currentWeeklyRuns
          ? String(prefill.fitnessBaseline.currentWeeklyRuns)
          : "";
  form.typicalWeeklyDistanceKm = draftData?.runnerProfile?.typicalWeeklyDistanceKm
    ? String(draftData.runnerProfile.typicalWeeklyDistanceKm)
    : draftData?.fitnessBaseline?.currentWeeklyDistanceKm
      ? String(draftData.fitnessBaseline.currentWeeklyDistanceKm)
      : profile?.typicalWeeklyDistanceKm
        ? String(profile.typicalWeeklyDistanceKm)
        : prefill?.fitnessBaseline.currentWeeklyDistanceKm
          ? String(prefill.fitnessBaseline.currentWeeklyDistanceKm)
          : "";
  form.longestRecentRunKm = draftData?.runnerProfile?.longestRecentRunKm
    ? String(draftData.runnerProfile.longestRecentRunKm)
    : draftData?.fitnessBaseline?.longestRecentRunKm
      ? String(draftData.fitnessBaseline.longestRecentRunKm)
      : profile?.longestRecentRunKm
        ? String(profile.longestRecentRunKm)
        : prefill?.fitnessBaseline.longestRecentRunKm
          ? String(prefill.fitnessBaseline.longestRecentRunKm)
          : "";
  form.planEffortPreference =
    draftData?.reviewPreferences?.planEffortPreference ??
    draftData?.runnerProfile?.planEffortPreference ??
    profile?.planEffortPreference ??
    null;
  form.willingForSpeedwork = draftData?.constraints?.willingForSpeedwork ?? false;
  form.willingForHills = draftData?.constraints?.willingForHills ?? false;
  form.willingForCrossTraining =
    draftData?.constraints?.willingForCrossTraining ?? false;

  return form;
}
