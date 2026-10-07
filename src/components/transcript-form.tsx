"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/schemas";
import type { CreatedProject, DraftError } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; projects: CreatedProject[] }
  | { kind: "error"; errors: DraftError[] };

export function TranscriptForm({ sample }: { sample: string | null }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const pending = state.kind === "pending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
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
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <Label htmlFor="transcript">Meeting transcript</Label>
        <Textarea
          id="transcript"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_TRANSCRIPT_CHARS}
          disabled={pending}
          placeholder="Paste the meeting transcript here..."
          className="min-h-80 font-mono"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !text.trim()}>
            {pending ? (
              <>
                <Spinner /> Analyzing meeting...
              </>
            ) : (
              "Create from Transcript"
            )}
          </Button>
          {sample !== null && (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setText(sample)}
            >
              Load sample transcript
            </Button>
          )}
          {pending && (
            <span className="text-muted-foreground text-sm" role="status">
              This can take up to 40 seconds.
            </span>
          )}
        </div>
      </form>

      {state.kind === "success" && (
        <Card role="status" className="border-green-600">
          <CardContent className="space-y-3 p-6">
            <p className="font-semibold">
              Created {state.projects.length}{" "}
              {state.projects.length === 1 ? "project" : "projects"} and{" "}
              {state.projects.reduce((n, p) => n + p.taskCount, 0)} tasks
            </p>
            <ul className="list-inside list-disc text-sm">
              {state.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {p.name}
                  </Link>{" "}
                  ({p.taskCount} tasks)
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {state.kind === "error" && (
        <Card role="alert" className="border-destructive">
          <CardContent className="space-y-3 p-6">
            <p className="text-destructive font-semibold">
              Nothing was saved. Please fix the following and try again:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {state.errors.map((er, i) => (
                <li key={i}>
                  <span className="font-medium">{er.where}:</span> {er.message}
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground text-sm">
              Your transcript is still above. Edit it and submit again.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
