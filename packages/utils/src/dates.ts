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

export { formatDateTime, formatDateRange };
