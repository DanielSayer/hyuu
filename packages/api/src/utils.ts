import type z from "zod";

export function parseNullableJsonb<T>(
  value: unknown,
  schema: z.ZodType<T>,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
