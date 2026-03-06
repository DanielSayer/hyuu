import type z from "zod";

import type {
  createRunningPlanScaffoldFromDraftInputSchema,
  getRunningPlanCycleInputSchema,
  getRunningPlanScaffoldInputSchema,
  listRunningPlanCyclesInputSchema,
  listRunningPlanScaffoldsInputSchema,
  RunningPlanCycleReviewInput,
  RunningPlanDraftData,
  RunningPlanProfileInput,
  RunningPlanScaffoldInput,
  RunningPlanScaffoldPatch,
  saveRunningPlanDraftStepInputSchema,
  updateRunningPlanScaffoldInputSchema,
} from "../../schemas/running-plans";

export type SaveRunningPlanDraftStepInput = z.infer<
  typeof saveRunningPlanDraftStepInputSchema
>;

export type CreateRunningPlanScaffoldFromDraftInput = z.infer<
  typeof createRunningPlanScaffoldFromDraftInputSchema
>;

export type GetRunningPlanScaffoldInput = z.infer<
  typeof getRunningPlanScaffoldInputSchema
>;

export type UpdateRunningPlanScaffoldInput = z.infer<
  typeof updateRunningPlanScaffoldInputSchema
>;

export type ListRunningPlanScaffoldsInput = z.infer<
  typeof listRunningPlanScaffoldsInputSchema
>;

export type ListRunningPlanCyclesInput = z.infer<
  typeof listRunningPlanCyclesInputSchema
>;

export type GetRunningPlanCycleInput = z.infer<
  typeof getRunningPlanCycleInputSchema
>;

export type {
  RunningPlanCycleReviewInput,
  RunningPlanDraftData,
  RunningPlanProfileInput,
  RunningPlanScaffoldInput,
  RunningPlanScaffoldPatch,
};
