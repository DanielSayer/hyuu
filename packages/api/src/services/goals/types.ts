import type z from "zod";

import {
  archiveGoalInputSchema,
  createGoalInputSchema,
  updateGoalInputSchema,
} from "../../schemas/goals";

export type CreateGoalInput = z.infer<typeof createGoalInputSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalInputSchema>;
export type ArchiveGoalInput = z.infer<typeof archiveGoalInputSchema>;
