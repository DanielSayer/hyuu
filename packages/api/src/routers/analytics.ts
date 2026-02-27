import { z } from "zod";

import { protectedProcedure } from "../index";
import { getAnalytics, getDashboard } from "../services/analytics";

export const analyticsProcedures = {
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    return getDashboard(ctx.session.user.id);
  }),
  analytics: protectedProcedure
    .input(
      z
        .object({
          year: z.number().int().min(1970).max(3000).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      return getAnalytics({
        userId: ctx.session.user.id,
        year: input?.year,
      });
    }),
};
