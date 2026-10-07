"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, FileText, Search, SearchX } from "lucide-react";
import { OUTCOME, OutcomeBadge } from "@/components/history/outcome-badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/task-meta";
import type { MeetingHistoryItem, MeetingOutcome } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "ALL" | MeetingOutcome;

const FILTERS: Filter[] = [
  "ALL",
  "SAVED",
  "INVALID",
  "NOT_RELEVANT",
  "REPLACED",
];

/** Searchable list of every transcript analysis, filterable by outcome. */
export function HistoryList({ items }: { items: MeetingHistoryItem[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      ALL: items.length,
      SAVED: 0,
      INVALID: 0,
      NOT_RELEVANT: 0,
      REPLACED: 0,
    };
    for (const i of items) c[i.outcome] += 1;
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (i) =>
        (filter === "ALL" || i.outcome === filter) &&
        (!needle ||
          [
            i.title,
            i.category,
            i.summary,
            i.createdByName,
            i.sourceName ?? "",
          ].some((v) => v.toLowerCase().includes(needle))),
    );
  }, [items, q, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
            aria-hidden
          />
          <label htmlFor="history-search" className="sr-only">
            Search transcripts
          </label>
          <Input
            id="history-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, summary, file..."
            className="h-10 pl-9"
          />
        </div>
        <div
          role="group"
          aria-label="Filter by outcome"
          className="flex flex-wrap gap-1"
        >
          {FILTERS.filter((f) => f === "ALL" || counts[f] > 0).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f === "ALL" ? "All" : OUTCOME[f].label}
              <span className="text-xs tabular-nums opacity-70">
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" aria-hidden />}
          title="No transcripts yet"
        >
          Analysed transcripts will appear here, including ones that were not
          saved.
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" aria-hidden />}
          title="No matching transcripts"
        />
      ) : (
        <ul className="bg-card shadow-card stagger divide-y overflow-hidden rounded-xl border">
          {shown.map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/transcript/history/${i.id}`}
                className="hover:bg-muted/50 focus-visible:ring-ring group flex items-center gap-4 px-5 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              >
                <span className="bg-secondary text-foreground hidden h-10 w-10 shrink-0 place-items-center rounded-lg border sm:grid">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{i.title}</p>
                    <OutcomeBadge outcome={i.outcome} />
                  </div>
                  <p className="text-muted-foreground mt-0.5 truncate text-sm">
                    {i.summary || "No summary."}
                  </p>
                  <p className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <span>{formatDateTime(i.createdAt)}</span>
                    <span>{i.createdByName}</span>
                    <span>
                      {i.sourceName ? `File: ${i.sourceName}` : "Pasted text"}
                    </span>
                    {i.charCount > 0 && (
                      <span>{i.charCount.toLocaleString("en-US")} chars</span>
                    )}
                    {i.outcome === "SAVED" && (
                      <span>
                        {i.liveProjectCount}{" "}
                        {i.liveProjectCount === 1 ? "project" : "projects"}
                      </span>
                    )}
                    {i.agenda.length > 0 && (
                      <span>{i.agenda.length} agenda items</span>
                    )}
                  </p>
                </div>
                <ChevronRight
                  className="text-muted-foreground group-hover:text-foreground h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
