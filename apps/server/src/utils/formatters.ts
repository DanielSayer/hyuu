export function formatStravaName(
  firstname?: string | null,
  lastname?: string | null,
) {
  return [firstname, lastname].filter(Boolean).join(" ") || null;
}
