import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  FileText,
  FolderKanban,
  RotateCcw,
} from "lucide-react";
import { CopyButton } from "@/components/history/copy-button";
import { OutcomeBadge } from "@/components/history/outcome-badge";
import { MeetingInsightsPanel } from "@/components/meeting-insights";
import { Button } from "@/components/ui/button";
import { getMeetingDetail } from "@/lib/access";
import { requireUser } from "@/lib/session";
import { formatDateTime } from "@/lib/task-meta";

export const metadata: Metadata = { title: "Transcript | NullToPlan" };

export default async function TranscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/projects");
  const { id } = await params;
  const m = await getMeetingDetail(user, id);
  if (!m) notFound();
  const removed = m.projectIds.length - m.projects.length;

  return (
    <div className="space-y-8">
      <Link
        href="/admin/transcript/history"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring group inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        />
        Transcript history
      </Link>

      <header className="animate-fade-up flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <OutcomeBadge outcome={m.outcome} />
            {m.category && (
              <span className="text-muted-foreground text-xs font-medium">
                {m.category}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {m.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatDateTime(m.createdAt)} · {m.createdByName} ·{" "}
            {m.sourceName ? `File: ${m.sourceName}` : "Pasted text"}
          </p>
        </div>
        {m.transcript && (
          <Button asChild>
            <Link href={`/admin/transcript?from=${m.id}`}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Re-run in editor
            </Link>
          </Button>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0 space-y-6">
          {m.errors.length > 0 && (
            <section
              aria-labelledby="errors-heading"
              className="rounded-xl border border-red-200 bg-red-50/60 p-5 dark:border-red-500/30 dark:bg-red-500/10"
            >
              <h2
                id="errors-heading"
                className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-300"
              >
                <AlertTriangle className="h-4 w-4" aria-hidden />
                {m.outcome === "NOT_RELEVANT"
                  ? "Why nothing was created"
                  : "What needed fixing"}
              </h2>
              <ul className="mt-3 space-y-2">
                {m.errors.map((e, i) => (
                  <li
                    key={i}
                    className="bg-card rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{e.where}</span>
                    <span className="block">{e.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {m.outcome === "SAVED" || m.outcome === "REPLACED" ? (
            <section aria-labelledby="projects-heading" className="space-y-3">
              <h2
                id="projects-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Projects created
              </h2>
              {m.projects.length > 0 ? (
                <ul className="bg-card shadow-card divide-y overflow-hidden rounded-xl border">
                  {m.projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:bg-muted/50 group flex min-h-12 items-center gap-3 px-5 py-3 text-sm transition-colors"
                      >
                        <FolderKanban
                          className="text-muted-foreground h-4 w-4"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {p.name}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {p.taskCount} {p.taskCount === 1 ? "task" : "tasks"}
                        </span>
                        <ArrowUpRight
                          className="text-muted-foreground group-hover:text-foreground h-4 w-4"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              {removed > 0 && (
                <p className="text-muted-foreground text-sm">
                  {removed}{" "}
                  {removed === 1
                    ? "project from this run has"
                    : "projects from this run have"}{" "}
                  since been {m.outcome === "REPLACED" ? "replaced or " : ""}
                  deleted.
                </p>
              )}
            </section>
          ) : null}

          <section aria-labelledby="transcript-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="transcript-heading"
                className="flex items-center gap-2 text-lg font-semibold tracking-tight"
              >
                <FileText
                  className="text-muted-foreground h-5 w-5"
                  aria-hidden
                />
                Original transcript
              </h2>
              {m.transcript && <CopyButton text={m.transcript} />}
            </div>
            {m.transcript ? (
              <pre className="bg-card shadow-card max-h-[32rem] overflow-auto rounded-xl border p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
                {m.transcript}
              </pre>
            ) : (
              <p className="text-muted-foreground bg-card rounded-xl border border-dashed p-5 text-sm">
                The text of this transcript was not stored (it was analysed
                before history was added).
              </p>
            )}
          </section>
        </div>

        <MeetingInsightsPanel insights={m} />
      </div>
    </div>
  );
}
