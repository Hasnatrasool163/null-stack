"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <div
      role="alert"
      className="bg-card shadow-card animate-fade-up mx-auto mt-10 flex max-w-md flex-col items-center rounded-xl border px-6 py-12 text-center"
    >
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
        <TriangleAlert className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        We could not load this page. Please try again.
      </p>
      <Button className="mt-6" onClick={() => retry()}>
        <RotateCcw className="h-4 w-4" aria-hidden /> Try again
      </Button>
    </div>
  );
}
