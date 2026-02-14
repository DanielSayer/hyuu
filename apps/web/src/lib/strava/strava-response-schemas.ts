import z from "zod";

export const stravaConnectionResponseSchema = z.union([
  z.object({
    connected: z.literal(false),
  }),
  z.object({
    connected: z.literal(true),
    connection: z.object({
      athleteName: z.string(),
      connectedAt: z.string(),
    }),
  }),
]);

export const stravaTestResponseSchema = z.object({
  ok: z.boolean(),
  testedAt: z.string(),
  tokenExpiresAt: z.string(),
  athlete: z.object({
    id: z.number(),
    username: z.string().nullable(),
    name: z.string().nullable(),
  }),
});

export const stravaDisconnectResponseSchema = z.object({
  disconnected: z.literal(true),
});

export const stravaSyncStatusResponseSchema = z.object({
  connected: z.boolean(),
  canSync: z.boolean(),
  cooldownRemainingSeconds: z.number().int().nonnegative(),
  cooldownEndsAt: z.string().nullable(),
  lastSuccessfulSyncAt: z.string().nullable(),
});

export const stravaSyncResponseSchema = z.object({
  ok: z.literal(true),
  fetchedCount: z.number().int().nonnegative(),
  createdCount: z.number().int().nonnegative(),
  updatedCount: z.number().int().nonnegative(),
  tokenExpiresAt: z.string(),
  afterTimestamp: z.string(),
  completedAt: z.string(),
  cooldownRemainingSeconds: z.number().int().nonnegative(),
  cooldownEndsAt: z.string().nullable(),
});
