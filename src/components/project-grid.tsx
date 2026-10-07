"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard, type ProjectSummary } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";

type SortKey = "deadline" | "name" | "tasks" | "hours";

const SORTS: Record<
  SortKey,
  { label: string; compare: (a: ProjectSummary, b: ProjectSummary) => number }
> = {
  deadline: {
    label: "Deadline (soonest)",
    compare: (a, b) => a.deadline.localeCompare(b.deadline),
  },
  name: {
    label: "Name (A-Z)",
    compare: (a, b) => a.name.localeCompare(b.name),
  },
  tasks: { label: "Most tasks", compare: (a, b) => b.taskCount - a.taskCount },
  hours: { label: "Most hours", compare: (a, b) => b.hours - a.hours },
};

const selectCls =
  "border-input bg-card h-10 cursor-pointer rounded-lg border px-3 text-sm shadow-xs transition-colors hover:border-primary/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none";

/** Project cards with instant client-side search, manager filter and sorting. */
export function ProjectGrid({
  projects,
  today,
}: {
  projects: ProjectSummary[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const [manager, setManager] = useState("");
  const [sort, setSort] = useState<SortKey>("deadline");
  const managers = useMemo(
    () => [...new Set(projects.map((p) => p.managerName))].sort(),
    [projects],
  );
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return projects
      .filter(
        (p) =>
          (!manager || p.managerName === manager) &&
          (!needle ||
            [p.name, p.clientName, p.managerName].some((v) =>
              v.toLowerCase().includes(needle),
            )),
      )
      .sort(SORTS[sort].compare);
  }, [projects, q, manager, sort]);
  const filtered = q || manager;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="projects-heading"
          className="text-lg font-semibold tracking-tight"
        >
          Projects{" "}
          <span className="text-muted-foreground font-normal">
            ({projects.length})
          </span>
        </h2>
        {projects.length > 1 && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-56">
              <Search
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden
              />
              <label htmlFor="project-search" className="sr-only">
                Search projects
              </label>
              <Input
                id="project-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search projects, clients..."
                className="h-10 pl-9"
              />
            </div>
            {managers.length > 1 && (
              <>
                <label htmlFor="project-manager" className="sr-only">
                  Filter by manager
                </label>
                <select
                  id="project-manager"
                  value={manager}
                  onChange={(e) => setManager(e.target.value)}
                  className={selectCls}
                >
                  <option value="">All managers</option>
                  {managers.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label htmlFor="project-sort" className="sr-only">
              Sort projects
            </label>
            <select
              id="project-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectCls}
            >
              {(Object.keys(SORTS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORTS[k].label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <p className="sr-only" role="status">
        {filtered ? `${shown.length} of ${projects.length} projects shown` : ""}
      </p>
      {shown.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" aria-hidden />}
          title="No matching projects"
        >
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setQ("");
              setManager("");
            }}
          >
            Clear filters
          </Button>
        </EmptyState>
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((p) => (
            <ProjectCard key={p.id} project={p} today={today} />
          ))}
        </div>
      )}
    </div>
  );
}
