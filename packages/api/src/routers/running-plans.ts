import { protectedProcedure, router } from "../index";
import {
  createRunningPlanScaffoldFromDraftInputSchema,
  getRunningPlanCycleInputSchema,
  getRunningPlanScaffoldInputSchema,
  listRunningPlanCyclesInputSchema,
  listRunningPlanScaffoldsInputSchema,
  runningPlanCycleReviewInputSchema,
  runningPlanProfileInputSchema,
  saveRunningPlanDraftStepInputSchema,
  updateRunningPlanScaffoldInputSchema,
} from "../schemas/running-plans";
import {
  createRunningPlanScaffoldFromDraft,
  getRunningPlanCycle,
  getRunningPlanDraft,
  getRunningPlanProfile,
  getRunningPlanScaffold,
  listRunningPlanCycles,
  listRunningPlanScaffolds,
  saveRunningPlanCycleReview,
  saveRunningPlanDraftStep,
  updateRunningPlanScaffold,
  upsertRunningPlanProfile,
} from "../services/running-plans";

export const runningPlansRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return getRunningPlanProfile(ctx.session.user.id);
  }),
  upsertProfile: protectedProcedure
    .input(runningPlanProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      return upsertRunningPlanProfile({
        userId: ctx.session.user.id,
        input,
      });
    }),
  getDraft: protectedProcedure.query(async ({ ctx }) => {
    return getRunningPlanDraft(ctx.session.user.id);
  }),
  saveDraftStep: protectedProcedure
    .input(saveRunningPlanDraftStepInputSchema)
    .mutation(async ({ ctx, input }) => {
      return saveRunningPlanDraftStep({
        userId: ctx.session.user.id,
        input,
      });
    }),
  createScaffoldFromDraft: protectedProcedure
    .input(createRunningPlanScaffoldFromDraftInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createRunningPlanScaffoldFromDraft({
        userId: ctx.session.user.id,
        input,
      });
    }),
  getScaffold: protectedProcedure
    .input(getRunningPlanScaffoldInputSchema)
    .query(async ({ ctx, input }) => {
      return getRunningPlanScaffold({
        userId: ctx.session.user.id,
        input,
      });
    }),
  updateScaffold: protectedProcedure
    .input(updateRunningPlanScaffoldInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateRunningPlanScaffold({
        userId: ctx.session.user.id,
        input,
      });
    }),
  listScaffolds: protectedProcedure
    .input(listRunningPlanScaffoldsInputSchema.optional())
    .query(async ({ ctx, input }) => {
      return listRunningPlanScaffolds({
        userId: ctx.session.user.id,
        input: input ?? {},
      });
    }),
  listCycles: protectedProcedure
    .input(listRunningPlanCyclesInputSchema)
    .query(async ({ ctx, input }) => {
      return listRunningPlanCycles({
        userId: ctx.session.user.id,
        input,
      });
    }),
  getCycle: protectedProcedure
    .input(getRunningPlanCycleInputSchema)
    .query(async ({ ctx, input }) => {
      return getRunningPlanCycle({
        userId: ctx.session.user.id,
        input,
      });
    }),
  saveCycleReview: protectedProcedure
    .input(runningPlanCycleReviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      return saveRunningPlanCycleReview({
        userId: ctx.session.user.id,
        input,
      });
    }),
});
