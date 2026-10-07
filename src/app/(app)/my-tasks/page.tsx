import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CalendarDays, Clock3, FolderKanban, ListChecks, ListTodo } from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { StatCard } from "@/components/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getMyTasks } from "@/lib/access";
import { daysUntil, formatDate, formatHours, todayYmd } from "@/lib/format";
import { requireUser } from "@/lib/session";
import type { MyTask } from "@/lib/types";

export const metadata: Metadata = { title: "My Tasks | NovaWorks" };

function groupByProject(tasks: MyTask[]) {
  const groups = new Map<
    string,
    { projectId: string; projectName: string; managerName: string; tasks: MyTask[] }
  >();
  for (const t of tasks) {
    const g = groups.get(t.projectId) ?? {
      projectId: t.projectId,
      projectName: t.projectName,
      managerName: t.managerName,
      tasks: [],
    };
    g.tasks.push(t);
    groups.set(t.projectId, g);
  }
  return [...groups.values()];
}

export default async function MyTasksPage() {
  const user = await requireUser();
  if (user.role !== "AGENT") redirect("/projects");
  const tasks = await getMyTasks(user);
  const groups = groupByProject(tasks);
  const today = todayYmd();
  const hours = tasks.reduce((n, t) => n + t.estimatedHours, 0);
  const next = [...tasks]
    .filter((t) => daysUntil(t.deadline, today) >= 0)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatDate(today)}
        title="My Tasks"
        description="Everything assigned to you, grouped by project."
      />

      {groups.length === 0 ? (
        <EmptyState icon={<ListTodo className="h-5 w-5" aria-hidden />} title="You're all clear">
          No tasks are assigned to you yet.
        </EmptyState>
      ) : (
        <>
          <section aria-label="Summary" className="stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <StatCard label="Tasks" value={tasks.length} icon={ListChecks} tone="indigo" hint={`Across ${groups.length} ${groups.length === 1 ? "project" : "projects"}`} />
            <StatCard label="Estimated effort" value={hours} suffix="h" icon={Clock3} tone="emerald" hint="Your total hours" />
            <div className="col-span-2 lg:col-span-1">
              <StatCard
                label="Next due"
                value={next ? Math.max(0, daysUntil(next.deadline, today)) : 0}
                suffix={next ? "days" : undefined}
                icon={CalendarDays}
                tone="amber"
                hint={next ? next.title : "Nothing upcoming"}
              />
            </div>
          </section>

          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.projectId} aria-labelledby={`p-${g.projectId}`} className="animate-fade-up space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="bg-accent text-primary grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                      <FolderKanban className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 id={`p-${g.projectId}`} className="truncate text-lg font-semibold tracking-tight">
                        <Link
                          href={`/projects/${g.projectId}`}
                          className="hover:text-primary focus-visible:ring-ring group inline-flex items-center gap-1 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {g.projectName}
                          <ArrowUpRight className="h-4 w-4 opacity-50 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden />
                        </Link>
                      </h2>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Avatar name={g.managerName} size="sm" className="h-5 w-5 text-[9px] ring-0" />
                        Manager: {g.managerName}
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="stagger grid gap-4 md:grid-cols-2">
                  {g.tasks.map((t) => (
                    <li
                      key={t.id}
                      className="bg-card shadow-card hover:shadow-lift flex flex-col rounded-xl border p-5 transition-shadow duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold">{t.title}</h3>
                        <DueBadge deadline={t.deadline} today={today} className="shrink-0" />
                      </div>
                      <p className="text-muted-foreground mt-2 flex-1 text-sm leading-relaxed">
                        {t.description || "No description."}
                      </p>
                      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden />
                          <dt className="sr-only">Deadline</dt>
                          <dd className="font-medium">Due {formatDate(t.deadline)}</dd>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="text-muted-foreground h-4 w-4" aria-hidden />
                          <dt className="sr-only">Estimated hours</dt>
                          <dd className="font-medium tabular-nums">{formatHours(t.estimatedHours)}</dd>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
