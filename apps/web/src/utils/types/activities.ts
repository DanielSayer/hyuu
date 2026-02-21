import type { trpc, TRPCResult } from "../trpc";

type Activity = TRPCResult<typeof trpc.activity.queryOptions>;
type ActivityMapData = Activity["mapData"];
type ActivitySplit = Activity["intervals"][number];

export type { Activity, ActivityMapData, ActivitySplit };
