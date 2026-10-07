import { Badge, type BadgeTone } from "@/components/ui/misc";
import type { MeetingOutcome } from "@/lib/types";

export const OUTCOME: Record<
  MeetingOutcome,
  { label: string; tone: BadgeTone }
> = {
  SAVED: { label: "Saved", tone: "success" },
  INVALID: { label: "Needs fixes", tone: "danger" },
  NOT_RELEVANT: { label: "Not relevant", tone: "neutral" },
  REPLACED: { label: "Replaced", tone: "warning" },
};

export function OutcomeBadge({ outcome }: { outcome: MeetingOutcome }) {
  const o = OUTCOME[outcome] ?? OUTCOME.SAVED;
  return <Badge tone={o.tone}>{o.label}</Badge>;
}
