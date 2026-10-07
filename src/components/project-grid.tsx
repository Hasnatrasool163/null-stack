"use client";

import { Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { ProjectCard, type ProjectSummary } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";

/** Project cards with an instant client-side filter (name, client, manager). */
export function ProjectGrid({
  projects,
  today,
}: {
  projects: ProjectSummary[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) =>
      [p.name, p.clientName, p.managerName].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    );
  }, [projects, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="projects-heading" className="text-lg font-semibold tracking-tight">
          Projects{" "}
          <span className="text-muted-foreground font-normal">({projects.length})</span>
        </h2>
        {projects.length > 1 && (
          <div className="relative w-full sm:w-64">
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
        )}
      </div>
      <p className="sr-only" role="status">
        {q ? `${shown.length} of ${projects.length} projects shown` : ""}
      </p>
      {shown.length === 0 ? (
        <EmptyState icon={<SearchX className="h-5 w-5" aria-hidden />} title="No matching projects">
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setQ("")}>
            Clear search
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
