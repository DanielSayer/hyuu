import {
  CalendarRange,
  Flag,
  HeartPulse,
  Mountain,
  Route,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type {
  TrainingPlanEffortPreference,
  TrainingPlanExperienceLevel,
  TrainingPlanGoalType,
  TrainingPlanMotivation,
} from "./types";

export interface TrainingPlanGoalOption {
  type: TrainingPlanGoalType;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  activeBorder: string;
  iconColor: string;
  badgeColor: string;
}

export const trainingPlanGoalOptions: readonly TrainingPlanGoalOption[] = [
  {
    type: "general_fitness",
    title: "General Fitness",
    description: "Build a healthy routine and keep running part of your week.",
    icon: HeartPulse,
    gradient: "from-sky-500/15 to-cyan-500/10",
    activeBorder: "border-sky-500/70",
    iconColor: "text-sky-400",
    badgeColor: "bg-sky-500/10 text-sky-400",
  },
  {
    type: "consistency",
    title: "Consistency",
    description: "Lock in steady weekly frequency and make the habit stick.",
    icon: CalendarRange,
    gradient: "from-violet-500/15 to-fuchsia-500/10",
    activeBorder: "border-violet-500/70",
    iconColor: "text-violet-400",
    badgeColor: "bg-violet-500/10 text-violet-400",
  },
  {
    type: "distance",
    title: "Distance Goal",
    description: "Work toward a target distance milestone over the next block.",
    icon: Route,
    gradient: "from-emerald-500/15 to-teal-500/10",
    activeBorder: "border-emerald-500/70",
    iconColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-400",
  },
  {
    type: "race",
    title: "Race Goal",
    description: "Aim at a race date and give the backend enough context to plan.",
    icon: Trophy,
    gradient: "from-amber-500/15 to-orange-500/10",
    activeBorder: "border-amber-500/70",
    iconColor: "text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-400",
  },
];

export const weekDayOptions = [
  { value: 0, label: "Sun", shortLabel: "S" },
  { value: 1, label: "Mon", shortLabel: "M" },
  { value: 2, label: "Tue", shortLabel: "T" },
  { value: 3, label: "Wed", shortLabel: "W" },
  { value: 4, label: "Thu", shortLabel: "T" },
  { value: 5, label: "Fri", shortLabel: "F" },
  { value: 6, label: "Sat", shortLabel: "S" },
] as const;

export const experienceLevelOptions: ReadonlyArray<{
  value: TrainingPlanExperienceLevel;
  label: string;
}> = [
  { value: "new", label: "New to running" },
  { value: "returning", label: "Returning" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const motivationOptions: ReadonlyArray<{
  value: TrainingPlanMotivation;
  label: string;
}> = [
  { value: "fitness", label: "General fitness" },
  { value: "consistency", label: "Consistency" },
  { value: "weight_loss", label: "Weight loss" },
  { value: "stress_relief", label: "Stress relief" },
  { value: "performance", label: "Performance" },
  { value: "race", label: "Race" },
];

export const effortPreferenceOptions: ReadonlyArray<{
  value: TrainingPlanEffortPreference;
  label: string;
}> = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "ambitious", label: "Ambitious" },
];

export const constraintOptions = [
  {
    key: "willingForSpeedwork",
    title: "Speedwork",
    description: "Include harder sessions when useful.",
    icon: Flag,
  },
  {
    key: "willingForHills",
    title: "Hills",
    description: "Use hill work when the plan needs it.",
    icon: Mountain,
  },
  {
    key: "willingForCrossTraining",
    title: "Cross-training",
    description: "Mix in non-run sessions when helpful.",
    icon: ShieldCheck,
  },
] as const;
