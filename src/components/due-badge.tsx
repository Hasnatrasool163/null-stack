import { Clock } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/misc";
import {
  daysUntil,
  relativeDue,
  todayYmd,
  urgency,
  type Urgency,
} from "@/lib/format";

const TONE: Record<Urgency, BadgeTone> = {
  overdue: "danger",
  soon: "warning",
  upcoming: "default",
  later: "neutral",
};

/** Deadline countdown chip. The text says the status, so colour is never the only cue. */
export function DueBadge({
  deadline,
  today = todayYmd(),
  className,
}: {
  deadline: string;
  today?: string;
  className?: string;
}) {
  const days = daysUntil(deadline, today);
  return (
    <Badge tone={TONE[urgency(days)]} className={className}>
      <Clock className="h-3 w-3" aria-hidden />
      {relativeDue(days)}
    </Badge>
  );
}
