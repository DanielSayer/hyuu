import { z } from "zod";

import { protectedProcedure } from "../index";
import {
  getActivitiesMap,
  getActivityById,
  getRecentActivities,
  getTrainingPlan,
} from "../services/activities";

export const activitiesProcedures = {
  recentActivities: protectedProcedure.query(async ({ ctx }) => {
    return getRecentActivities(ctx.session.user.id);
  }),
  activitiesMap: protectedProcedure
    .input(
      z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getActivitiesMap({
        userId: ctx.session.user.id,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
    }),
  trainingPlan: protectedProcedure
    .input(
      z.object({
        startDate: z.iso.datetime(),
        endDate: z.iso.datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getTrainingPlan({
        userId: ctx.session.user.id,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      });
    }),
  activity: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getActivityById({
        userId: ctx.session.user.id,
        id: input.id,
      });
    }),
};
