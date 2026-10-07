import Link from "next/link";
import { CalendarClock, Gauge, GitPullRequestArrow } from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatHours, formatShortDate } from "@/lib/format";
import type { Meeting, Project, Task } from "@/lib/types";

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const id = `panel-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section
      aria-labelledby={id}
      className="bg-card shadow-card rounded-xl border"
    >
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <span className="text-primary">{icon}</span>
        <h2 id={id} className="text-sm font-semibold">
          {title}
        </h2>
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

/** The next few task deadlines, soonest first. */
export function UpcomingDeadlines({
  tasks,
  projects,
  today,
  limit = 5,
}: {
  tasks: Task[];
  projects: Project[];
  today: string;
  limit?: number;
}) {
  const names = new Map(projects.map((p) => [p.id, p.name]));
  const upcoming = [...tasks]
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, limit);
  return (
    <Panel
      title="Upcoming deadlines"
      icon={<CalendarClock className="h-4 w-4" aria-hidden />}
    >
      {upcoming.length === 0 ? (
        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
          No tasks scheduled.
        </p>
      ) : (
        <ul>
          {upcoming.map((t) => (
            <li key={t.id}>
              <Link
                href={`/projects/${t.projectId}`}
                className="hover:bg-muted focus-visible:ring-ring flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="bg-accent text-accent-foreground grid h-11 w-11 shrink-0 place-items-center rounded-lg text-center text-[11px] leading-tight font-semibold whitespace-pre-line">
                  {formatShortDate(t.deadline).replace(" ", "\n")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.title}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {names.get(t.projectId)} · {t.assigneeName}
                  </span>
                </span>
                <DueBadge
                  deadline={t.deadline}
                  today={today}
                  className="hidden sm:inline-flex lg:hidden xl:inline-flex"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** Estimated hours per assignee, as simple proportional bars. */
export function Workload({ tasks }: { tasks: Task[] }) {
  const byPerson = new Map<string, { hours: number; count: number }>();
  for (const t of tasks) {
    const cur = byPerson.get(t.assigneeName) ?? { hours: 0, count: 0 };
    cur.hours += t.estimatedHours;
    cur.count += 1;
    byPerson.set(t.assigneeName, cur);
  }
  const rows = [...byPerson.entries()].sort((a, b) => b[1].hours - a[1].hours);
  const max = Math.max(1, ...rows.map(([, r]) => r.hours));
  return (
    <Panel
      title="Team workload"
      icon={<Gauge className="h-4 w-4" aria-hidden />}
    >
      {rows.length === 0 ? (
        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
          Nobody has work assigned yet.
        </p>
      ) : (
        <ul className="space-y-1 px-3 py-2">
          {rows.map(([name, r], i) => (
            <li key={name} className="py-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Avatar name={name} size="sm" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {name}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {r.count} {r.count === 1 ? "task" : "tasks"} ·{" "}
                  {formatHours(r.hours)}
                </span>
              </div>
              <div
                className="bg-muted mt-2 ml-9 h-1.5 overflow-hidden rounded-full"
                aria-hidden
              >
                <div
                  className="animate-grow-x bg-primary h-full origin-left rounded-full"
                  style={{
                    width: `${(r.hours / max) * 100}%`,
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** The most recent meeting's suggested agenda, so the next meeting starts prepared. */
export function NextAgenda({ meeting }: { meeting: Meeting }) {
  const items = meeting.agenda.slice(0, 5);
  return (
    <Panel
      title="Next meeting agenda"
      icon={<GitPullRequestArrow className="h-4 w-4" aria-hidden />}
    >
      <p className="text-muted-foreground truncate px-3 pt-2 text-xs">
        From: {meeting.title}
      </p>
      {items.length === 0 ? (
        <p className="text-muted-foreground px-3 py-6 text-center text-sm">
          Nothing left open. Everything was settled.
        </p>
      ) : (
        <ol className="space-y-1 px-3 py-2">
          {items.map((a, i) => (
            <li key={`${a.topic}-${i}`} className="flex gap-2.5 py-1.5 text-sm">
              <span className="text-muted-foreground w-4 shrink-0 text-right text-xs leading-5 font-semibold tabular-nums">
                {i + 1}.
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{a.topic}</span>
                {a.suggestedOwner && (
                  <span className="text-muted-foreground block text-xs">
                    Owner: {a.suggestedOwner}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
