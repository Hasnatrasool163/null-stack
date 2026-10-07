import { cn } from "@/lib/utils";

/**
 * NullToPlan mark: an empty-set "null" circle whose slash continues
 * into an arrow, i.e. from nothing to a plan.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("h-8 w-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <circle
        cx="13.5"
        cy="18.5"
        r="6.25"
        fill="none"
        strokeWidth="2.25"
        className="stroke-primary-foreground"
      />
      <path
        d="M8.5 23.5 23 9M17 9h6v6"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="text-[15px] leading-none tracking-tight">
        <span className="font-semibold">Null</span>
        <span className="text-primary font-medium">To</span>
        <span className="font-semibold">Plan</span>
      </span>
    </span>
  );
}
