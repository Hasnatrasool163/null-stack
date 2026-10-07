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

/** '20 Oct' (no year), for compact lists. */
export function formatShortDate(value: string): string {
  const [, m, d] = value.split("-");
  const month = MONTHS[Number(m) - 1];
  if (!month || !d) return value;
  return `${Number(d)} ${month}`;
}

export function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} h`;
}

/** Today's date as 'YYYY-MM-DD' in the server's local time zone. */
export function todayYmd(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

function ymdToUtc(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from `today` to `deadline` (negative when overdue). Both 'YYYY-MM-DD'. */
export function daysUntil(deadline: string, today: string): number {
  return Math.round((ymdToUtc(deadline) - ymdToUtc(today)) / 86_400_000);
}

export type Urgency = "overdue" | "soon" | "upcoming" | "later";

export function urgency(days: number): Urgency {
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  if (days <= 10) return "upcoming";
  return "later";
}

/** 'Overdue by 2 days', 'Due today', 'In 5 days'. */
export function relativeDue(days: number): string {
  if (days < 0) return `Overdue by ${-days} ${-days === 1 ? "day" : "days"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}
