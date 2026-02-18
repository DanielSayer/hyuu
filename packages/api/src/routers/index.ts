import { db } from "@hyuu/db";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  activities: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z
          .object({
            id: z.number().int().positive(),
            startDate: z.string().datetime(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cursorStartDate = input.cursor
        ? new Date(input.cursor.startDate)
        : undefined;

      const rows = await db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.isNotNull(table.startDate),
            input.cursor && cursorStartDate
              ? operators.or(
                  operators.lt(table.startDate, cursorStartDate),
                  operators.and(
                    operators.eq(table.startDate, cursorStartDate),
                    operators.lt(table.id, input.cursor.id),
                  ),
                )
              : undefined,
          ),
        orderBy: (table, operators) => [
          operators.desc(table.startDate),
          operators.desc(table.id),
        ],
        limit: input.limit + 1,
        columns: {
          id: true,
          name: true,
          distance: true,
          startDate: true,
          elapsedTime: true,
          averageHeartrate: true,
        },
      });

      const hasNextPage = rows.length > input.limit;
      const items = hasNextPage ? rows.slice(0, input.limit) : rows;
      const lastItem = items.at(-1);
      const nextCursor =
        hasNextPage && lastItem?.startDate
          ? {
              id: lastItem.id,
              startDate: lastItem.startDate.toISOString(),
            }
          : undefined;

      return {
        items: items.map((item) => ({
          id: item.id,
          name: item.name ?? "Untitled activity",
          distance: item.distance ?? 0,
          startDate: item.startDate,
          elapsedTime: item.elapsedTime,
          averageHeartrate: item.averageHeartrate,
        })),
        nextCursor,
      };
    }),
});
export type AppRouter = typeof appRouter;
