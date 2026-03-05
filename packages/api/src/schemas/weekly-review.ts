import { z } from "zod";
import { goalTypeSchema } from "./goals";

export const weeklyReviewGoalSchema = z.object({
  goalId: z.number().int().positive(),
  goalType: goalTypeSchema,
  targetValue: z.number(),
  currentValue: z.number(),
  completed: z.boolean(),
  completionRatio: z.number().nonnegative(),
});

export const weeklyReviewResultSchema = z.object({
  shouldShow: z.boolean(),
  weekStartDay: z.union([z.literal(0), z.literal(1)]),
  period: z
    .object({
      reviewWeekStart: z.date(),
      reviewWeekEnd: z.date(),
    })
    .nullable(),
  totals: z
    .object({
      distanceM: z.number().nonnegative(),
      runCount: z.number().int().nonnegative(),
      elapsedS: z.number().int().nonnegative(),
      avgPaceSecPerKm: z.number().positive().nullable(),
    })
    .nullable(),
  comparisonVsPriorWeek: z
    .object({
      distanceMDelta: z.number(),
      runCountDelta: z.number().int(),
      paceSecPerKmDelta: z.number().nullable(),
    })
    .nullable(),
  goals: z.array(weeklyReviewGoalSchema),
  highlights: z
    .object({
      bestDistanceDayM: z.number().positive().optional(),
      longestRunM: z.number().positive().optional(),
      fastestRunPaceSecPerKm: z.number().positive().optional(),
    })
    .nullable(),
});

export type WeeklyReviewResult = z.infer<typeof weeklyReviewResultSchema>;
