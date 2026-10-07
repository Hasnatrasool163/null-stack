import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { MeetingInsightsPanel } from "@/components/meeting-insights";
import { formatDateTime } from "@/lib/task-meta";
import type { Meeting } from "@/lib/types";

/** Past transcript analyses, newest first; each expands to its insights. */
export function RecentMeetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) return null;
  return (
    <section aria-labelledby="recent-meetings" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2
          id="recent-meetings"
          className="text-lg font-semibold tracking-tight"
        >
          Recent meetings
        </h2>
        <Link
          href="/admin/transcript/history"
          className="text-muted-foreground hover:text-foreground inline-flex min-h-9 items-center gap-1 text-sm font-medium transition-colors"
        >
          View all history <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <ul className="space-y-2">
        {meetings.map((m) => (
          <li key={m.id}>
            <details className="group bg-card shadow-card rounded-xl border open:pb-4">
              <summary className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-xl px-5 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(m.createdAt)} · {m.createdByName} ·{" "}
                    {m.projectIds.length}{" "}
                    {m.projectIds.length === 1 ? "project" : "projects"} ·{" "}
                    {m.agenda.length} agenda{" "}
                    {m.agenda.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <ChevronDown
                  className="text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="px-4">
                <MeetingInsightsPanel insights={m} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
