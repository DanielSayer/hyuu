import { MapPin, Repeat, Timer, Zap, type LucideIcon } from "lucide-react";
import type { GoalCadence, GoalType } from "./types";

export interface GoalTypeOption {
  type: GoalType;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  border: string;
  activeBorder: string;
  iconColor: string;
  badgeColor: string;
  unit: string;
  placeholder: string;
  hint: string;
}

export interface CadenceOption {
  value: GoalCadence;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const goalTypes: readonly GoalTypeOption[] = [
  {
    type: "distance",
    title: "Distance Goal",
    description: "Set a target distance and watch the kilometers stack up.",
    icon: MapPin,
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    activeBorder: "border-emerald-500",
    iconColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-400",
    unit: "km",
    placeholder: "e.g. 30",
    hint: "Total kilometers to run",
  },
  {
    type: "frequency",
    title: "Frequency Goal",
    description: "Commit to a number of runs and build the habit.",
    icon: Repeat,
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    activeBorder: "border-violet-500",
    iconColor: "text-violet-400",
    badgeColor: "bg-violet-500/10 text-violet-400",
    unit: "runs",
    placeholder: "e.g. 4",
    hint: "Number of runs to complete",
  },
  {
    type: "pace",
    title: "Pace Goal",
    description: "Push your speed and hit a new personal best pace.",
    icon: Timer,
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    activeBorder: "border-amber-500",
    iconColor: "text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-400",
    unit: "min/km",
    placeholder: "e.g. 5.30",
    hint: "Target pace in minutes per km",
  },
];

export const cadenceOptions: readonly CadenceOption[] = [
  {
    value: "weekly",
    label: "Weekly",
    description: "Reset every Monday",
    icon: Zap,
  },
  {
    value: "monthly",
    label: "Monthly",
    description: "Reset on the 1st",
    icon: Repeat,
  },
];
