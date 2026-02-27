import { z } from "zod";

export const goalTypeSchema = z.enum([
  "distance",
  "activity_count",
  "time",
  "streak",
]);

export type GoalType = z.infer<typeof goalTypeSchema>;

export const createGoalInputSchema = z.object({
  goalType: goalTypeSchema,
  targetValue: z.number().positive(),
});

export const updateGoalInputSchema = z.object({
  id: z.number().int().positive(),
  targetValue: z.number().positive(),
});

export const archiveGoalInputSchema = z.object({
  id: z.number().int().positive(),
});
