"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CopyPlus,
  FolderKanban,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/task-meta";
import type { DuplicateMeeting } from "@/lib/types";
import { cn } from "@/lib/utils";

type Choice = "replace" | "keep";

/** Shown when the admin submits a transcript that was already processed. */
export function DuplicateDialog({
  duplicate,
  onReplace,
  onKeepBoth,
  onCancel,
}: {
  duplicate: DuplicateMeeting | null;
  onReplace: () => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}) {
  const [choice, setChoice] = useState<Choice>("replace");
  const d = duplicate;
  const hasProjects = !!d && d.projects.length > 0;
  const effective: Choice = hasProjects ? choice : "keep";

  return (
    <Modal
      open={!!d}
      onOpenChange={(o) => {
        if (!o) {
          setChoice("replace");
          onCancel();
        }
      }}
      title="This transcript was already processed"
      description={
        d
          ? `"${d.title}" was analysed on ${formatDateTime(d.createdAt)} by ${d.createdByName}.`
          : undefined
      }
    >
      {d && (
        <div className="space-y-5">
          {hasProjects ? (
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
                It created
              </p>
              <ul className="divide-y rounded-lg border">
                {d.projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/projects/${p.id}`}
                      target="_blank"
                      className="hover:bg-accent/50 group flex min-h-11 items-center gap-3 px-3 py-2 text-sm transition-colors"
                    >
                      <FolderKanban
                        className="text-primary h-4 w-4 shrink-0"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {p.name}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {p.taskCount} {p.taskCount === 1 ? "task" : "tasks"}
                      </span>
                      <ArrowUpRight
                        className="text-muted-foreground group-hover:text-primary h-4 w-4"
                        aria-hidden
                      />
                      <span className="sr-only">(opens in a new tab)</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              The projects it created have since been deleted.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              What would you like to do?
            </legend>
            {hasProjects && (
              <Option
                value="replace"
                checked={choice === "replace"}
                onChange={setChoice}
                icon={<RefreshCw className="h-4 w-4" aria-hidden />}
                title="Replace previous"
                text="Re-analyse and swap in fresh projects. The old ones are only removed if the new analysis succeeds."
              />
            )}
            <Option
              value="keep"
              checked={effective === "keep"}
              onChange={setChoice}
              icon={<CopyPlus className="h-4 w-4" aria-hidden />}
              title={hasProjects ? "Keep both" : "Analyse again"}
              text={
                hasProjects
                  ? "Create a second set of projects alongside the existing ones."
                  : "Run the analysis again and create new projects."
              }
            />
          </fieldset>

          {effective === "replace" && (
            <p
              role="note"
              className="flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Any edits, status changes, links and comments on those
              projects&apos; tasks will be lost.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setChoice("replace");
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button
              variant={effective === "replace" ? "destructive" : "default"}
              onClick={() => {
                setChoice("replace");
                if (effective === "replace") onReplace();
                else onKeepBoth();
              }}
            >
              {effective === "replace" ? (
                <>
                  <RefreshCw className="h-4 w-4" aria-hidden /> Replace previous
                </>
              ) : (
                <>
                  <CopyPlus className="h-4 w-4" aria-hidden />{" "}
                  {hasProjects ? "Keep both" : "Analyse again"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Option({
  value,
  checked,
  onChange,
  icon,
  title,
  text,
}: {
  value: Choice;
  checked: boolean;
  onChange: (v: Choice) => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border p-3 transition-[border-color,background-color] duration-200",
        "has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2",
        checked ? "border-primary bg-accent/40" : "hover:border-primary/40",
      )}
    >
      <input
        type="radio"
        name="duplicate-choice"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
          checked
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="text-muted-foreground block text-sm">{text}</span>
      </span>
    </label>
  );
}
