import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  ListChecks,
  Users,
} from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { TaskTable } from "@/components/task-table";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/misc";
import { getProjectById } from "@/lib/access";
import { formatDate, formatHours, todayYmd } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Project | NullToPlan" };

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-secondary text-foreground grid h-9 w-9 shrink-0 place-items-center rounded-lg border">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
        <dd className="mt-0.5 font-semibold">{children}</dd>
      </div>
    </div>
  );
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getProjectById(user, id);
  if (!detail) notFound();
  const { project, tasks } = detail;
  const today = todayYmd();
  const hours = tasks.reduce((n, t) => n + t.estimatedHours, 0);
  const people = new Set(tasks.map((t) => t.assigneeId)).size;

  return (
    <div className="space-y-8">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring group inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        All projects
      </Link>

      <section className="bg-card shadow-card animate-fade-up relative overflow-hidden rounded-2xl border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent"
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              {project.clientName}
            </span>
            <DueBadge deadline={project.deadline} today={today} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {project.name}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-relaxed sm:text-base">
            {project.description || "No description."}
          </p>

          <dl className="mt-6 grid gap-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <Fact
              icon={<Building2 className="h-4 w-4" aria-hidden />}
              label="Client"
            >
              {project.clientName}
            </Fact>
            <Fact
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Project manager"
            >
              <span className="inline-flex items-center gap-2">
                <Avatar name={project.managerName} size="sm" />
                {project.managerName}
              </span>
            </Fact>
            <Fact
              icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              label="Deadline"
            >
              {formatDate(project.deadline)}
            </Fact>
            <Fact
              icon={<Clock3 className="h-4 w-4" aria-hidden />}
              label="Estimated effort"
            >
              <span className="tabular-nums">{formatHours(hours)}</span>
              <span className="text-muted-foreground font-normal">
                {" "}
                · {people} {people === 1 ? "developer" : "developers"}
              </span>
            </Fact>
          </dl>
        </div>
      </section>

      <section aria-labelledby="tasks-heading" className="space-y-4">
        <h2
          id="tasks-heading"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <ListChecks className="text-muted-foreground h-5 w-5" aria-hidden />
          Tasks
          <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
            {tasks.length}
          </span>
        </h2>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<ListChecks className="h-5 w-5" aria-hidden />}
            title="No tasks to show"
          >
            This project has no tasks you can see.
          </EmptyState>
        ) : (
          <TaskTable tasks={tasks} today={today} />
        )}
      </section>
    </div>
  );
}
