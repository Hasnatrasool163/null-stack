import {
  AlertTriangle,
  CircleHelp,
  GitPullRequestArrow,
  ListChecks,
  RotateCcw,
  Scale,
} from "lucide-react";
import type { AgendaKind, MeetingInsights } from "@/lib/types";

const KIND: Record<AgendaKind, { label: string; icon: typeof CircleHelp }> = {
  OPEN_QUESTION: { label: "Open question", icon: CircleHelp },
  UNRESOLVED: { label: "Missing detail", icon: ListChecks },
  FOLLOW_UP: { label: "Follow-up", icon: RotateCcw },
  RISK: { label: "Risk", icon: AlertTriangle },
  DECISION: { label: "Decision needed", icon: Scale },
};

/** Summary, open questions and the suggested next-meeting agenda. */
export function MeetingInsightsPanel({
  insights,
}: {
  insights: MeetingInsights;
}) {
  return (
    <section
      aria-labelledby="insights-heading"
      className="bg-card shadow-card animate-fade-up rounded-xl border"
    >
      <div className="border-b px-5 py-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Meeting insights{insights.category && ` · ${insights.category}`}
        </p>
        <h2 id="insights-heading" className="mt-1 font-semibold tracking-tight">
          {insights.title}
        </h2>
        {insights.summary && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {insights.summary}
          </p>
        )}
      </div>

      {insights.agenda.length > 0 && (
        <div className="border-b px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GitPullRequestArrow
              className="text-muted-foreground h-4 w-4"
              aria-hidden
            />
            Suggested agenda for the next meeting
          </h3>
          <ol className="stagger mt-3 space-y-2.5">
            {insights.agenda.map((a, i) => {
              const k = KIND[a.kind];
              return (
                <li key={`${a.topic}-${i}`} className="flex gap-3">
                  <span className="bg-accent text-accent-foreground grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{a.topic}</p>
                    {a.reason && (
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        {a.reason}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <k.icon className="h-3.5 w-3.5" aria-hidden /> {k.label}
                      </span>
                      {a.suggestedOwner && (
                        <span>Owner: {a.suggestedOwner}</span>
                      )}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {insights.openQuestions.length > 0 && (
        <div className="px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CircleHelp className="text-muted-foreground h-4 w-4" aria-hidden />
            Open questions
          </h3>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
            {insights.openQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {insights.agenda.length === 0 && insights.openQuestions.length === 0 && (
        <p className="text-muted-foreground px-5 py-4 text-sm">
          No open questions or follow-ups were found. Everything discussed was
          settled.
        </p>
      )}
    </section>
  );
}
