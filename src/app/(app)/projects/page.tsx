import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock3, FolderKanban, ListChecks, Sparkles } from "lucide-react";
import { UpcomingDeadlines, Workload } from "@/components/dashboard-panels";
import type { ProjectSummary } from "@/components/project-card";
import { ProjectGrid } from "@/components/project-grid";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getProjects, getVisibleTasks } from "@/lib/access";
import { daysUntil, formatDate, relativeDue, todayYmd } from "@/lib/format";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Projects | NovaWorks" };

const EMPTY: Record<string, string> = {
  ADMIN: "No projects yet. Use Create from Transcript to generate them from a meeting.",
  MANAGER: "No projects are assigned to you yet.",
  AGENT: "No projects include tasks assigned to you yet.",
};

const SUBTITLE: Record<string, string> = {
  ADMIN: "Every project and task across NovaWorks.",
  MANAGER: "The projects you manage and your team's workload.",
  AGENT: "Projects that include tasks assigned to you.",
};

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function ProjectsPage() {
  const user = await requireUser();
  const [projects, tasks] = await Promise.all([getProjects(user), getVisibleTasks(user)]);
  const now = new Date();
  const today = todayYmd(now);
  const firstName = user.name.split(" ")[0];

  const summaries: ProjectSummary[] = projects.map((p) => {
    const own = tasks.filter((t) => t.projectId === p.id);
    return {
      ...p,
      hours: own.reduce((n, t) => n + t.estimatedHours, 0),
      assignees: [...new Set(own.map((t) => t.assigneeName))],
    };
  });
  const totalHours = tasks.reduce((n, t) => n + t.estimatedHours, 0);
  const next = projects
    .filter((p) => daysUntil(p.deadline, today) >= 0)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const people = new Set(tasks.map((t) => t.assigneeId)).size;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={formatDate(today)}
        title={`${greeting(now)}, ${firstName}`}
        description={SUBTITLE[user.role]}
      >
        {user.role === "ADMIN" && (
          <Button asChild>
            <Link href="/admin/transcript">
              <Sparkles className="h-4 w-4" aria-hidden /> New from transcript
            </Link>
          </Button>
        )}
      </PageHeader>

      {projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-5 w-5" aria-hidden />} title="Nothing here yet">
          {EMPTY[user.role]}
        </EmptyState>
      ) : (
        <>
          <section aria-label="Summary" className="stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Projects" value={projects.length} icon={FolderKanban} tone="indigo" hint="Visible to you" />
            <StatCard
              label={user.role === "AGENT" ? "My tasks" : "Tasks"}
              value={tasks.length}
              icon={ListChecks}
              tone="sky"
              hint={user.role === "AGENT" ? "Assigned to you" : `Across ${people} ${people === 1 ? "developer" : "developers"}`}
            />
            <StatCard label="Estimated effort" value={totalHours} suffix="h" icon={Clock3} tone="emerald" hint="Developer hours" />
            <StatCard
              label="Next deadline"
              value={next ? Math.max(0, daysUntil(next.deadline, today)) : 0}
              suffix={next ? "days" : undefined}
              icon={CalendarDays}
              tone="amber"
              hint={next ? `${next.name} · ${relativeDue(daysUntil(next.deadline, today))}` : "No upcoming deadlines"}
            />
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <section aria-labelledby="projects-heading" className="min-w-0">
              <ProjectGrid projects={summaries} today={today} />
            </section>
            <div className="animate-fade-up space-y-6 [animation-delay:150ms]">
              <UpcomingDeadlines tasks={tasks} projects={projects} today={today} />
              {user.role !== "AGENT" && <Workload tasks={tasks} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
