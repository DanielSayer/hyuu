export function toDateOnlyString(date: Date) {
  return date.toISOString().split("T")[0];
}
