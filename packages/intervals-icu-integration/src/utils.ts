function toDateOrNull(value: string | null | undefined) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIntOrNull(value: number | null | undefined) {
  return typeof value === "number" ? Math.trunc(value) : null;
}

function toNumberOrNull(value: number | null | undefined) {
  return typeof value === "number" ? value : null;
}

function toIntArrayOrNull(value: number[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => Math.trunc(entry));
}

function toNumberArrayOrNull(value: number[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => Number(entry));
}

function toDateOnlyString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export {
  toDateOrNull,
  toIntOrNull,
  toNumberOrNull,
  toIntArrayOrNull,
  toNumberArrayOrNull,
  toDateOnlyString,
};
