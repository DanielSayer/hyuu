export function formatIntervalsAthleteName({
  name,
  firstName,
  lastName,
  firstname,
  lastname,
}: {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}) {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const assembled =
    [firstName ?? firstname, lastName ?? lastname].filter(Boolean).join(" ") ??
    "";
  return assembled.trim() || "Intervals athlete";
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to process Intervals request.";
}
