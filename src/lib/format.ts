const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Formats a 'YYYY-MM-DD' string as '20 Oct 2026' without using Date (no timezone shifts). */
export function formatDate(value: string): string {
  const [y, m, d] = value.split("-");
  const month = MONTHS[Number(m) - 1];
  if (!y || !month || !d) return value;
  return `${Number(d)} ${month} ${y}`;
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}
