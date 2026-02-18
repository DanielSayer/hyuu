import { db } from "@hyuu/db";
import { z } from "zod";

import { protectedProcedure, publicProcedure, router } from "../index";

const MAX_ROUTE_PREVIEW_POINTS = 120;

type LatLng = [number, number];
type RoutePreview = {
  hasRoute: boolean;
  bounds: [number, number, number, number] | null;
  latlngs: LatLng[];
};

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toLatLngPair(value: unknown): LatLng | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }
  const lat = toFiniteNumber(value[0]);
  const lng = toFiniteNumber(value[1]);
  if (lat === null || lng === null) {
    return null;
  }
  return [lat, lng];
}

function simplifyLatLngs(points: LatLng[], maxPoints: number): LatLng[] {
  if (points.length <= maxPoints) {
    return points;
  }

  const step = (points.length - 1) / (maxPoints - 1);
  const simplified: LatLng[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    const index = Math.round(i * step);
    simplified.push(points[index] ?? points[points.length - 1]!);
  }
  return simplified;
}

function computeBounds(points: LatLng[]): [number, number, number, number] | null {
  if (points.length === 0) {
    return null;
  }

  let minLat = Number.POSITIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lng < minLng) minLng = lng;
    if (lat > maxLat) maxLat = lat;
    if (lng > maxLng) maxLng = lng;
  }

  return [minLat, minLng, maxLat, maxLng];
}

function parseRoutePreview(mapData: unknown): RoutePreview {
  if (!mapData || typeof mapData !== "object") {
    return { hasRoute: false, bounds: null, latlngs: [] };
  }

  const mapObject = mapData as {
    latlngs?: unknown;
    route?: { latlngs?: unknown } | null;
  };

  const baseLatLngs = Array.isArray(mapObject.latlngs) ? mapObject.latlngs : [];
  const routeLatLngs = Array.isArray(mapObject.route?.latlngs)
    ? mapObject.route.latlngs
    : [];
  const source = routeLatLngs.length > 0 ? routeLatLngs : baseLatLngs;

  const parsed = source
    .map((point) => toLatLngPair(point))
    .filter((point): point is LatLng => point !== null);
  const simplified = simplifyLatLngs(parsed, MAX_ROUTE_PREVIEW_POINTS);

  return {
    hasRoute: simplified.length > 1,
    bounds: computeBounds(simplified),
    latlngs: simplified,
  };
}

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
          mapData: true,
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
          routePreview: parseRoutePreview(item.mapData),
        })),
        nextCursor,
      };
    }),
  activitiesRoutePreviews: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number().int().positive()).max(200),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.ids.length === 0) {
        return [];
      }

      const rows = await db.query.intervalsActivity.findMany({
        where: (table, operators) =>
          operators.and(
            operators.eq(table.userId, ctx.session.user.id),
            operators.inArray(table.id, input.ids),
          ),
        columns: {
          id: true,
          mapData: true,
        },
      });

      return rows.map((row) => ({
        id: row.id,
        routePreview: parseRoutePreview(row.mapData),
      }));
    }),
});
export type AppRouter = typeof appRouter;
