import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, ListChecks } from "lucide-react";
import { DueBadge } from "@/components/due-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDate, formatHours } from "@/lib/format";
import type { Project } from "@/lib/types";

export type ProjectSummary = Project & {
  hours: number;
  done: number;
  assignees: string[];
};

export function ProjectCard({
  project,
  today,
}: {
  project: ProjectSummary;
  today: string;
}) {
  const shown = project.assignees.slice(0, 4);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group bg-card shadow-card hover:shadow-lift focus-visible:ring-ring ease-soft relative flex h-full cursor-pointer flex-col rounded-xl border p-5 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-zinc-300 focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
            {project.clientName}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight">
            {project.name}
          </h3>
        </div>
        <ArrowUpRight
          className="text-muted-foreground group-hover:text-foreground h-5 w-5 shrink-0 transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </div>

      <p className="text-muted-foreground mt-3 line-clamp-2 min-h-10 text-sm">
        {project.description || "No description."}
      </p>

      <dl className="mt-4 mb-5 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <ListChecks className="text-muted-foreground h-4 w-4" aria-hidden />
          <dt className="sr-only">Tasks</dt>
          <dd>
            {project.done}/{project.taskCount} done
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock3 className="text-muted-foreground h-4 w-4" aria-hidden />
          <dt className="sr-only">Estimated hours</dt>
          <dd className="tabular-nums">{formatHours(project.hours)}</dd>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <CalendarDays className="text-muted-foreground h-4 w-4" aria-hidden />
          <dt className="sr-only">Deadline</dt>
          <dd className="flex flex-wrap items-center gap-2">
            {formatDate(project.deadline)}
            <DueBadge deadline={project.deadline} today={today} />
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <Avatar name={project.managerName} size="sm" />
          <span className="min-w-0">
            <span className="text-muted-foreground block text-[11px] leading-none">
              Manager
            </span>
            <span className="block truncate font-medium">
              {project.managerName}
            </span>
          </span>
        </div>
        {shown.length > 0 && (
          <div
            className="flex -space-x-2"
            aria-label={`Assigned: ${project.assignees.join(", ")}`}
            role="img"
          >
            {shown.map((n) => (
              <Avatar key={n} name={n} size="sm" />
            ))}
            {project.assignees.length > shown.length && (
              <span className="bg-secondary text-muted-foreground ring-card grid h-7 w-7 place-items-center rounded-full text-[11px] font-semibold ring-2">
                +{project.assignees.length - shown.length}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
