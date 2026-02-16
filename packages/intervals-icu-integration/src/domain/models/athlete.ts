import type { z } from "zod";
import type { intervalsAthleteSchema } from "../../acl/schemas/intervals-athlete-schemas";

export type IntervalsAthlete = z.infer<typeof intervalsAthleteSchema>;

export type IntervalsAthleteConnection = {
  athleteId: string;
  athleteName: string;
  connectedAt: Date;
};
