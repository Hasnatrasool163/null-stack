import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { TranscriptForm } from "@/components/transcript-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create from Transcript | NovaWorks" };

async function loadSample(): Promise<string | null> {
  try {
    return await readFile(
      path.join(process.cwd(), "src", "data", "transcript.txt"),
      "utf8",
    );
  } catch {
    return null;
  }
}

export default async function TranscriptPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/projects");
  const sample = await loadSample();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create from Transcript</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Paste a meeting transcript. The AI turns it into projects and tasks
          with managers, developers, deadlines and estimated hours.
        </p>
      </div>
      <TranscriptForm sample={sample} />
    </div>
  );
}
