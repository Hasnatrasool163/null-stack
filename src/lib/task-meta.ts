import type { TaskStatus } from "@/lib/types";

/** Display metadata for each Kanban column. Text labels always accompany colour. */
export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; badge: string; column: string }
> = {
  TODO: {
    label: "To do",
    dot: "bg-slate-400",
    badge: "bg-secondary text-secondary-foreground ring-1 ring-slate-500/15",
    column: "bg-secondary/60",
  },
  IN_PROGRESS: {
    label: "In progress",
    dot: "bg-primary",
    badge: "bg-accent text-accent-foreground ring-1 ring-primary/15",
    column: "bg-accent/35",
  },
  IN_REVIEW: {
    label: "In review",
    dot: "bg-tertiary",
    badge: "bg-tertiary-soft text-tertiary ring-1 ring-tertiary/20",
    column: "bg-tertiary-soft/45",
  },
  DONE: {
    label: "Done",
    dot: "bg-primary-strong",
    badge: "bg-primary text-primary-foreground",
    column: "bg-primary/[0.06]",
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
