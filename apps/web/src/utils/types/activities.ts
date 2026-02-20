import type { trpc, TRPCResult } from "../trpc";

type Activity = TRPCResult<typeof trpc.activity.queryOptions>;
type ActivityMapData = Activity["mapData"];

export type { ActivityMapData };
