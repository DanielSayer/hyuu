const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateRangeFormatterOpts: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

function formatDateTime(isoDate: string | null | undefined) {
  if (!isoDate) {
    return "Unknown date";
  }

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return dateTimeFormatter.format(date);
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);

  return `${s.toLocaleDateString("en-AU", dateRangeFormatterOpts)} - ${e.toLocaleDateString("en-AU", dateRangeFormatterOpts)}`;
}

function startOfMonthUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function startOfWeekUtc(date: Date, weekStartDay: 0 | 1): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = start.getUTCDay();
  const offsetToWeekStart =
    weekStartDay === 1
      ? day === 0
        ? -6
        : 1 - day
      : -day;
  start.setUTCDate(start.getUTCDate() + offsetToWeekStart);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function startOfIsoWeekUtc(date: Date): Date {
  return startOfWeekUtc(date, 1);
}

function toLocalDateTimeString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds(),
  )}`;
}

function toLocalDateOrNull(value: string | null | undefined): Date | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const zonedDate = new Date(value);
  if (!Number.isNaN(zonedDate.getTime()) && /[zZ]|[+-]\d{2}:\d{2}$/.test(value)) {
    return zonedDate;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/,
  );
  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second, millis] = match;
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Number(millis ?? "0"),
    ),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export {
  formatDateTime,
  formatDateRange,
  startOfIsoWeekUtc,
  startOfMonthUtc,
  startOfWeekUtc,
  toLocalDateOrNull,
  toLocalDateTimeString,
};
