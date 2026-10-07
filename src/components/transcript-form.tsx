"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  FileText,
  FileUp,
  Info,
  Sparkles,
} from "lucide-react";
import { MeetingInsightsPanel } from "@/components/meeting-insights";
import { Person } from "@/components/ui/avatar";
import { formatDate, formatHours } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/schemas";
import { readTranscriptFile, TRANSCRIPT_ACCEPT } from "@/lib/transcript-file";
import { DuplicateDialog } from "@/components/duplicate-dialog";
import type {
  CreatedProject,
  DraftError,
  DuplicateMeeting,
  MeetingInsights,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; projects: CreatedProject[]; insights: MeetingInsights }
  | { kind: "irrelevant"; errors: DraftError[]; insights?: MeetingInsights }
  | { kind: "error"; errors: DraftError[]; insights?: MeetingInsights };

/** What the server does, in order. Advanced on a timer while we wait; the last step holds until the reply. */
const STEPS = [
  "Reading the transcript",
  "Checking it is about technical work",
  "Extracting projects and tasks",
  "Matching people to the team directory",
  "Checking deadlines and hours",
  "Finding open questions for the next agenda",
  "Saving to the database",
];

function Progress() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      5000,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="bg-card shadow-card animate-fade-up rounded-xl border p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="bg-primary text-primary-foreground relative grid h-10 w-10 place-items-center rounded-lg">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span
            className="bg-primary/25 absolute inset-0 animate-ping rounded-lg"
            aria-hidden
          />
        </span>
        <div>
          <p className="font-semibold">Analyzing meeting...</p>
          <p className="text-muted-foreground text-xs">
            This usually takes 10 to 40 seconds.
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-300",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : active ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  active ? "font-medium" : done ? "" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function TranscriptForm({ sample }: { sample: string | null }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadFile(file: File | undefined) {
    if (!file || state.kind === "pending") return;
    const result = await readTranscriptFile(file);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setText(result.text);
    setLoadedFile(result.name);
    setState({ kind: "idle" });
    toast.success(
      result.cleaned
        ? `Loaded ${result.name} (timestamps removed)`
        : `Loaded ${result.name}`,
    );
  }
  const pending = state.kind === "pending";
  const nearLimit = text.length > MAX_TRANSCRIPT_CHARS * 0.9;

  const [duplicate, setDuplicate] = useState<DuplicateMeeting | null>(null);

  async function submit(onDuplicate?: "replace" | "keep") {
    if (pending || !text.trim()) return;
    setDuplicate(null);
    setState({ kind: "pending" });
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, onDuplicate }),
      });
      const data: unknown = await res.json();
      const body = data as {
        ok?: boolean;
        reason?: string;
        projects?: CreatedProject[];
        insights?: MeetingInsights;
        errors?: DraftError[];
        duplicate?: DuplicateMeeting;
      };
      if (body.reason === "DUPLICATE" && body.duplicate) {
        // Nothing ran yet: go back to idle and let the admin choose.
        setState({ kind: "idle" });
        setDuplicate(body.duplicate);
        return;
      }
      if (res.ok && body.ok && body.projects && body.insights) {
        setState({
          kind: "success",
          projects: body.projects,
          insights: body.insights,
        });
        toast.success(
          `${onDuplicate === "replace" ? "Replaced with" : "Created"} ${body.projects.length} ${body.projects.length === 1 ? "project" : "projects"}`,
        );
      } else {
        const errors = body.errors?.length
          ? body.errors
          : [
              {
                where: "Request",
                message: "Something went wrong. Nothing was saved.",
              },
            ];
        setState({
          kind: body.reason === "NOT_RELEVANT" ? "irrelevant" : "error",
          errors,
          insights: body.insights,
        });
      }
    } catch {
      setState({
        kind: "error",
        errors: [
          {
            where: "Network",
            message: "Could not reach the server. Nothing was saved.",
          },
        ],
      });
    }
  }

  const insights =
    state.kind === "pending" || state.kind === "idle"
      ? undefined
      : state.insights;
  return (
    <div className="space-y-8">
      <DuplicateDialog
        duplicate={duplicate}
        onReplace={() => void submit("replace")}
        onKeepBoth={() => void submit("keep")}
        onCancel={() => setDuplicate(null)}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="bg-card shadow-card animate-fade-up space-y-4 rounded-xl border p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label
              htmlFor="transcript"
              className="inline-flex items-center gap-2"
            >
              <FileText className="text-primary h-4 w-4" aria-hidden />
              Meeting transcript
            </Label>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => fileInput.current?.click()}
              >
                <FileUp className="h-4 w-4" aria-hidden /> Upload file
              </Button>
              {sample !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    setText(sample);
                    setLoadedFile(null);
                  }}
                >
                  Load sample transcript
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept={TRANSCRIPT_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void loadFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div
            className="relative"
            onDragEnter={(e) => {
              if (pending || !e.dataTransfer.types.includes("Files")) return;
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              if (pending || !e.dataTransfer.types.includes("Files")) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDragging(false);
            }}
            onDrop={(e) => {
              if (!e.dataTransfer.files.length) return;
              e.preventDefault();
              setDragging(false);
              void loadFile(e.dataTransfer.files[0]);
            }}
          >
            <Textarea
              id="transcript"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (!e.target.value) setLoadedFile(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void submit();
                }
              }}
              maxLength={MAX_TRANSCRIPT_CHARS}
              disabled={pending}
              aria-describedby="transcript-help transcript-count"
              aria-invalid={state.kind === "error" || undefined}
              placeholder="Paste the meeting transcript here, or drop a .txt, .md, .vtt or .srt file..."
              className="bg-muted/30 min-h-[22rem] font-mono text-[13px]"
            />
            {!text && !dragging && (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={pending}
                  className="border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-primary focus-visible:ring-ring pointer-events-auto inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 text-sm font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <FileUp className="h-4 w-4" aria-hidden />
                  Drop a file or browse
                </button>
              </div>
            )}
            {dragging && (
              <div
                aria-hidden
                className="border-primary bg-accent/85 text-accent-foreground animate-fade-in pointer-events-none absolute inset-0 grid place-items-center rounded-lg border-2 border-dashed backdrop-blur-[1px]"
              >
                <div className="text-center">
                  <FileUp className="mx-auto h-8 w-8" aria-hidden />
                  <p className="mt-2 font-semibold">Drop the transcript file</p>
                  <p className="text-sm opacity-80">.txt, .md, .vtt or .srt</p>
                </div>
              </div>
            )}
          </div>
          {loadedFile && (
            <p className="text-muted-foreground -mt-1 inline-flex items-center gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Loaded from{" "}
              <span className="text-foreground font-medium">{loadedFile}</span>.
              You can still edit it below.
            </p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id="transcript-help" className="text-muted-foreground text-xs">
              Press{" "}
              <kbd className="bg-secondary rounded border px-1.5 py-0.5 font-mono text-[11px]">
                ⌘/Ctrl
              </kbd>{" "}
              +{" "}
              <kbd className="bg-secondary rounded border px-1.5 py-0.5 font-mono text-[11px]">
                Enter
              </kbd>{" "}
              to submit.
            </p>
            <p
              id="transcript-count"
              className={cn(
                "text-xs tabular-nums",
                nearLimit
                  ? "text-warning font-medium"
                  : "text-muted-foreground",
              )}
            >
              {text.length.toLocaleString("en-US")} /{" "}
              {MAX_TRANSCRIPT_CHARS.toLocaleString("en-US")}
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={pending || !text.trim()}
          >
            {pending ? (
              <>
                <Spinner /> Analyzing meeting...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden /> Create from
                Transcript
              </>
            )}
          </Button>
        </form>

        <aside className="space-y-4">
          {state.kind === "idle" && (
            <div className="bg-card shadow-card animate-fade-up rounded-xl border p-5 [animation-delay:100ms]">
              <p className="font-semibold">How it works</p>
              <ol className="text-muted-foreground mt-3 space-y-3 text-sm">
                {[
                  "Paste any meeting transcript or load the sample. Kick-offs, stand-ups and planning calls all work.",
                  "The AI checks it is about technical work, then extracts projects, tasks, owners, deadlines and hours.",
                  "Every person is matched to the team directory. Anything unclear is flagged, never guessed.",
                  "If everything checks out, it's saved. Otherwise nothing is saved and you can fix the text.",
                  "You also get a summary, open questions and a suggested agenda for the next meeting.",
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="bg-accent text-accent-foreground grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {pending && <Progress />}

          {state.kind === "irrelevant" && (
            <div
              role="status"
              className="bg-card shadow-card animate-fade-up rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <Info
                  className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-semibold">
                    This meeting isn&apos;t about technical work
                  </p>
                  {state.errors.map((er, i) => (
                    <p key={i} className="text-muted-foreground mt-1 text-sm">
                      {er.where && er.where !== "Transcript" && (
                        <span className="text-foreground font-medium">
                          {er.where}:{" "}
                        </span>
                      )}
                      {er.message}
                    </p>
                  ))}
                  <p className="text-muted-foreground mt-3 text-xs">
                    Nothing was saved. Paste a meeting about software, IT or
                    technical work to generate tasks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {state.kind === "error" && (
            <div
              role="alert"
              className="animate-fade-up rounded-xl border border-red-200 bg-red-50/60 p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-destructive mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-semibold text-red-900">
                    Nothing was saved
                  </p>
                  <p className="mt-0.5 text-sm text-red-800">
                    Please fix the following and try again:
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {state.errors.map((er, i) => (
                  <li
                    key={i}
                    className="bg-card rounded-lg border border-red-100 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-red-900">
                      {er.where}
                    </span>
                    <span className="text-foreground block">{er.message}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4 text-xs">
                Your transcript is still in the editor. Edit it and submit
                again.
              </p>
            </div>
          )}

          {state.kind === "success" && (
            <div
              role="status"
              className="bg-card shadow-card animate-fade-up rounded-xl border p-5"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="text-success mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold">
                    Created {state.projects.length}{" "}
                    {state.projects.length === 1 ? "project" : "projects"} and{" "}
                    {state.projects.reduce((n, p) => n + p.taskCount, 0)} tasks
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    Saved. Review the details below or open them on the board.
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {(state.kind === "success" || insights) && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
          {state.kind === "success" ? (
            <section
              aria-labelledby="created-heading"
              className="min-w-0 space-y-4"
            >
              <h2
                id="created-heading"
                className="text-lg font-semibold tracking-tight"
              >
                Generated projects and tasks
              </h2>
              {state.projects.map((p) => (
                <CreatedProjectCard key={p.id} project={p} />
              ))}
            </section>
          ) : (
            <div className="hidden xl:block" />
          )}
          {insights && <MeetingInsightsPanel insights={insights} />}
        </div>
      )}
    </div>
  );
}

function CreatedProjectCard({ project: p }: { project: CreatedProject }) {
  return (
    <article className="bg-card shadow-card animate-fade-up overflow-hidden rounded-xl border">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            {p.clientName}
          </p>
          <h3 className="mt-0.5 font-semibold tracking-tight">{p.name}</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Manager {p.managerName} · Due {formatDate(p.deadline)} ·{" "}
            {formatHours(p.tasks.reduce((n, t) => n + t.estimatedHours, 0))}
          </p>
        </div>
        <Link
          href={`/projects/${p.id}`}
          className="hover:bg-accent focus-visible:ring-ring group inline-flex min-h-9 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Open
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </Link>
      </header>
      <ul className="divide-y">
        {p.tasks.map((t) => (
          <li
            key={t.title}
            className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="min-w-0">
              <p className="font-medium">{t.title}</p>
              {t.description && (
                <p className="text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:justify-end">
              <Person name={t.assigneeName} />
              <span>Due {formatDate(t.deadline)}</span>
              <span className="text-foreground font-medium tabular-nums">
                {formatHours(t.estimatedHours)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
