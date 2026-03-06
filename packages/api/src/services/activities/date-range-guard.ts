import { TRPCError } from "@trpc/server";

export function assertValidDateRange(startDate: Date, endDate: Date): void {
  if (startDate.getTime() <= endDate.getTime()) {
    return;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "startDate must be before or equal to endDate",
  });
}
