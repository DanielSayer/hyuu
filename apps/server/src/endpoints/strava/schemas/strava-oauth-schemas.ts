import z from "zod";

export const stravaTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number().int().positive(),
  athlete: z
    .object({
      id: z.number().int().positive(),
      firstname: z.string().nullable().optional(),
      lastname: z.string().nullable().optional(),
    })
    .optional(),
});

export const stravaAthleteSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().nullable().optional(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
});
