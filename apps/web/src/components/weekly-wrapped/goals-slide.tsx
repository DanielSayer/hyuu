import { motion } from "motion/react";
import type { WeeklyWrappedData } from "./weekly-wrapped";
import { FootprintsIcon, MapPinIcon, TargetIcon, ZapIcon } from "lucide-react";
import { formatPace } from "@hyuu/utils/pace";

function GoalsSlide({ data }: { data: WeeklyWrappedData }) {
  const completed = data.goals.filter((g) => g.completed).length;

  return (
    <motion.div
      className="flex flex-col gap-5 py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <TargetIcon className="mx-auto mb-2 size-9 text-teal-400" />
        <p className="text-card-foreground text-lg font-bold">Goals</p>
        <p className="text-muted-foreground text-xs">
          {completed}/{data.goals.length} completed this week
        </p>
      </motion.div>
      <div className="space-y-4">
        {data.goals.map((goal, i) => (
          <GoalRow key={goal.goalId} goal={goal} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function GoalRow({
  goal,
  index,
}: {
  goal: WeeklyWrappedData["goals"][number];
  index: number;
}) {
  const icon =
    goal.goalType === "distance" ? (
      <MapPinIcon className="size-4 text-emerald-400" />
    ) : goal.goalType === "frequency" ? (
      <FootprintsIcon className="size-4 text-teal-400" />
    ) : (
      <ZapIcon className="size-4 text-purple-400" />
    );

  const label =
    goal.goalType === "distance"
      ? "Distance"
      : goal.goalType === "frequency"
        ? "Frequency"
        : "Pace";

  const currentDisplay =
    goal.goalType === "distance"
      ? `${(goal.currentValue / 1000).toFixed(1)} km`
      : goal.goalType === "frequency"
        ? `${goal.currentValue} runs`
        : `${formatPace(1000, goal.currentValue)}`;

  const targetDisplay =
    goal.goalType === "distance"
      ? `${(goal.targetValue / 1000).toFixed(0)} km`
      : goal.goalType === "frequency"
        ? `${goal.targetValue} runs`
        : `${formatPace(1000, goal.targetValue)}`;

  const ratio = Math.min(goal.completionRatio, 1);

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.12 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-card-foreground text-sm font-medium">
            {label}
          </span>
          {goal.completed && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
              Done
            </span>
          )}
        </div>
        <span className="text-muted-foreground text-xs">
          {currentDisplay} / {targetDisplay}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          className={`h-full rounded-full ${
            goal.completed
              ? "bg-linear-to-r from-emerald-500 to-teal-400"
              : "bg-linear-to-r from-teal-600 to-teal-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{
            duration: 0.8,
            delay: 0.3 + index * 0.12,
            ease: "easeOut",
          }}
        />
      </div>
    </motion.div>
  );
}

export { GoalsSlide };
