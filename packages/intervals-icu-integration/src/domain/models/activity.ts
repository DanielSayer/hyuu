import type { z } from "zod";
import type {
  intervalsActivityDetailSchema,
  intervalsActivityEventSchema,
  intervalsActivityIntervalsSchema,
} from "../../acl/schemas/intervals-activity-schemas";

export type IntervalsActivityEvent = z.infer<typeof intervalsActivityEventSchema>;
export type IntervalsActivityDetail = z.infer<typeof intervalsActivityDetailSchema>;
export type IntervalsActivityIntervals = z.infer<
  typeof intervalsActivityIntervalsSchema
>;

export type IntervalsActivityAggregate = {
  activityId: string;
  detail: IntervalsActivityDetail;
  intervals: IntervalsActivityIntervals;
};
