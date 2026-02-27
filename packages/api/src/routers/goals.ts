import {
  createGoalInputSchema,
  updateGoalInputSchema,
  archiveGoalInputSchema,
} from "../schemas/goals";
import { protectedProcedure, router } from "../index";
import {
  archiveGoal,
  createGoal,
  listGoals,
  updateGoal,
} from "../services/goals";

export const goalsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return listGoals(ctx.session.user.id);
  }),
  create: protectedProcedure
    .input(createGoalInputSchema)
    .mutation(async ({ ctx, input }) => {
      return createGoal({
        userId: ctx.session.user.id,
        input,
      });
    }),
  update: protectedProcedure
    .input(updateGoalInputSchema)
    .mutation(async ({ ctx, input }) => {
      return updateGoal({
        userId: ctx.session.user.id,
        input,
      });
    }),
  archive: protectedProcedure
    .input(archiveGoalInputSchema)
    .mutation(async ({ ctx, input }) => {
      return archiveGoal({
        userId: ctx.session.user.id,
        input,
      });
    }),
});
