"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/schemas";
import type { CreatedProject, DraftError } from "@/lib/types";
import { cn } from "@/lib/utils";

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; projects: CreatedProject[] }
  | { kind: "error"; errors: DraftError[] };

/** What the server does, in order. Advanced on a timer while we wait; the last step holds until the reply. */
const STEPS = [
  "Reading the transcript",
  "Extracting projects and tasks",
  "Matching people to the team directory",
  "Checking deadlines and hours",
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
    <div className="bg-card shadow-card animate-fade-up rounded-xl border p-5" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="relative grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
          <span className="absolute inset-0 animate-ping rounded-lg bg-indigo-500/30" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Analyzing meeting...</p>
          <p className="text-muted-foreground text-xs">This usually takes 10 to 40 seconds.</p>
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
                  done && "border-emerald-500 bg-emerald-500 text-white",
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
              <span className={cn(active ? "font-medium" : done ? "" : "text-muted-foreground")}>
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
  const pending = state.kind === "pending";
  const nearLimit = text.length > MAX_TRANSCRIPT_CHARS * 0.9;

  async function submit() {
    if (pending || !text.trim()) return;
    setState({ kind: "pending" });
    try {
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text }),
      });
      const data: unknown = await res.json();
      const body = data as {
        ok?: boolean;
        projects?: CreatedProject[];
        errors?: DraftError[];
      };
      if (res.ok && body.ok && body.projects) {
        setState({ kind: "success", projects: body.projects });
        toast.success(
          `Created ${body.projects.length} ${body.projects.length === 1 ? "project" : "projects"}`,
        );
      } else {
        setState({
          kind: "error",
          errors: body.errors?.length
            ? body.errors
            : [{ where: "Request", message: "Something went wrong. Nothing was saved." }],
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="bg-card shadow-card animate-fade-up space-y-4 rounded-xl border p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="transcript" className="inline-flex items-center gap-2">
            <FileText className="text-primary h-4 w-4" aria-hidden />
            Meeting transcript
          </Label>
          {sample !== null && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setText(sample)}
            >
              Load sample transcript
            </Button>
          )}
        </div>
        <Textarea
          id="transcript"
          value={text}
          onChange={(e) => setText(e.target.value)}
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
          placeholder="Paste the meeting transcript here..."
          className="bg-muted/30 min-h-[22rem] font-mono text-[13px]"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="transcript-help" className="text-muted-foreground text-xs">
            Press <kbd className="bg-secondary rounded border px-1.5 py-0.5 font-mono text-[11px]">⌘/Ctrl</kbd>{" "}
            + <kbd className="bg-secondary rounded border px-1.5 py-0.5 font-mono text-[11px]">Enter</kbd> to submit.
          </p>
          <p
            id="transcript-count"
            className={cn("text-xs tabular-nums", nearLimit ? "text-warning font-medium" : "text-muted-foreground")}
          >
            {text.length.toLocaleString("en-US")} / {MAX_TRANSCRIPT_CHARS.toLocaleString("en-US")}
          </p>
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending || !text.trim()}>
          {pending ? (
            <>
              <Spinner /> Analyzing meeting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden /> Create from Transcript
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
                "Paste a transcript or load the sample.",
                "The AI extracts projects, tasks, owners, deadlines and hours.",
                "Every person is matched to the team directory. Anything unclear is flagged, never guessed.",
                "If everything checks out, it's saved. Otherwise nothing is saved and you can fix the text.",
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

        {state.kind === "success" && (
          <div role="status" className="animate-fade-up overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-sm">
            <div className="flex items-start gap-3 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-900">
                  Created {state.projects.length}{" "}
                  {state.projects.length === 1 ? "project" : "projects"} and{" "}
                  {state.projects.reduce((n, p) => n + p.taskCount, 0)} tasks
                </p>
                <p className="mt-0.5 text-sm text-emerald-800">Saved. Open a project to review it.</p>
              </div>
            </div>
            <ul className="stagger divide-y divide-emerald-100 border-t border-emerald-100 bg-white">
              {state.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:bg-muted focus-visible:ring-ring group flex min-h-12 items-center justify-between gap-3 px-5 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                      {p.taskCount} {p.taskCount === 1 ? "task" : "tasks"}
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {state.kind === "error" && (
          <div role="alert" className="animate-fade-up rounded-xl border border-red-200 bg-red-50/60 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-destructive mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold text-red-900">Nothing was saved</p>
                <p className="mt-0.5 text-sm text-red-800">Please fix the following and try again:</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {state.errors.map((er, i) => (
                <li key={i} className="rounded-lg border border-red-100 bg-white px-3 py-2 text-sm">
                  <span className="font-semibold text-red-900">{er.where}</span>
                  <span className="text-foreground block">{er.message}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-4 text-xs">
              Your transcript is still in the editor. Edit it and submit again.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
