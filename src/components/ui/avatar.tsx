import { cn } from "@/lib/utils";

// Neutral greys: enough variation to tell people apart without adding colour.
const TONES = [
  "bg-zinc-200 text-zinc-800",
  "bg-stone-200 text-stone-800",
  "bg-neutral-300 text-neutral-800",
  "bg-zinc-800 text-zinc-50",
  "bg-stone-100 text-stone-700 ring-stone-300",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Stable colour per name so the same person always looks the same. */
function tone(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

const SIZES = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-9 w-9 text-xs",
  lg: "h-12 w-12 text-sm",
} as const;

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "ring-card inline-grid shrink-0 place-items-center rounded-full font-semibold ring-2",
        SIZES[size],
        tone(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Avatar + name, the name stays readable for screen readers. */
export function Person({
  name,
  sub,
  size = "sm",
}: {
  name: string;
  sub?: string;
  size?: keyof typeof SIZES;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar name={name} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        {sub && (
          <span className="text-muted-foreground block truncate text-xs">
            {sub}
          </span>
        )}
      </span>
    </span>
  );
}
