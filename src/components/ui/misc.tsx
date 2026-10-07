import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden />
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--muted)_0%,var(--skeleton-shine)_50%,var(--muted)_100%)] bg-[length:200%_100%]",
      className,
    )}
  />
);

const badgeTones = {
  default: "bg-accent text-accent-foreground",
  neutral: "bg-secondary text-secondary-foreground",
  success:
    "bg-green-50 text-green-700 ring-1 ring-green-600/15 dark:bg-green-400/10 dark:text-green-300 dark:ring-green-400/20",
  warning:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  danger:
    "bg-red-50 text-red-700 ring-1 ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20",
  outline: "text-foreground ring-1 ring-border bg-card",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export const Badge = ({
  className,
  tone = "default",
  ...p
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
      badgeTones[tone],
      className,
    )}
    {...p}
  />
);

/** Section heading row with optional trailing slot (count, action). */
export const PageHeader = ({
  title,
  description,
  eyebrow,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <header className="animate-fade-up flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0 space-y-1">
      {eyebrow && (
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {description}
        </p>
      )}
    </div>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </header>
);

/** Friendly empty state with an icon. */
export const EmptyState = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="bg-card animate-fade-in flex flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center">
    <div className="bg-secondary text-foreground mb-4 grid h-12 w-12 place-items-center rounded-xl border">
      {icon}
    </div>
    <p className="font-semibold">{title}</p>
    {children && (
      <div className="text-muted-foreground mt-1 max-w-sm text-sm">
        {children}
      </div>
    )}
  </div>
);
