import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-700",
} as const;

export function StatCard({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="bg-card shadow-card rounded-xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        <span className="tabular-nums">{value}</span>
        {suffix && (
          <span className="text-muted-foreground ml-1 text-base font-medium">
            {suffix}
          </span>
        )}
      </p>
      {hint && <div className="text-muted-foreground mt-1 truncate text-xs">{hint}</div>}
    </div>
  );
}
