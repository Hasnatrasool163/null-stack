import type { TaskStatus } from "@/lib/types";

/** Display metadata for each Kanban column. Text labels always accompany colour. */
export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; badge: string; column: string }
> = {
  TODO: {
    label: "To do",
    dot: "bg-slate-400",
    badge:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-500/15 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
    column: "bg-slate-100/70 dark:bg-slate-400/[0.06]",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-sky-500",
    badge:
      "bg-sky-50 text-sky-700 ring-1 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
    column: "bg-sky-50/70 dark:bg-sky-400/[0.06]",
  },
  IN_REVIEW: {
    label: "In review",
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    column: "bg-amber-50/60 dark:bg-amber-400/[0.06]",
  },
  DONE: {
    label: "Done",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    column: "bg-emerald-50/60 dark:bg-emerald-400/[0.06]",
  },
};

/** '7 Oct 2026, 14:05' from an ISO timestamp, in the viewer's local time. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 'just now', '5 min ago', '3 h ago', '2 d ago', then a date. */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
  if (s < 7 * 86_400) return `${Math.round(s / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
