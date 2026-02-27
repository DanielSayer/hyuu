import { z } from "zod";

export const goalTypeSchema = z.enum(["distance", "frequency", "pace"]);

export type GoalType = z.infer<typeof goalTypeSchema>;

export const goalCadenceSchema = z.enum(["weekly", "monthly"]);

export type GoalCadence = z.infer<typeof goalCadenceSchema>;

export const createGoalInputSchema = z.object({
  goalType: goalTypeSchema,
  cadence: goalCadenceSchema,
  targetValue: z.number().positive(),
  trackStreak: z.boolean().optional(),
});

export const updateGoalInputSchema = z.object({
  id: z.number().int().positive(),
  targetValue: z.number().positive(),
});

export const archiveGoalInputSchema = z.object({
  id: z.number().int().positive(),
});
