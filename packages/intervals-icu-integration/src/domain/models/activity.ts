import type { z } from "zod";
import type {
  intervalsActivityDetailSchema,
  intervalsActivityEventSchema,
  intervalsActivityMapSchema,
} from "../../acl/schemas/intervals-activity-schemas";

export type IntervalsActivityEvent = z.infer<
  typeof intervalsActivityEventSchema
>;
export type IntervalsActivityDetail = z.infer<
  typeof intervalsActivityDetailSchema
>;
export type IntervalsActivityIntervals = IntervalsActivityDetail["intervals"];
export type IntervalsActivityMap = z.infer<typeof intervalsActivityMapSchema>;

export type IntervalsActivityAggregate = {
  activityId: string;
  detail: IntervalsActivityDetail;
  map: IntervalsActivityMap;
};
