import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { RecentMeetings } from "@/components/recent-meetings";
import { TranscriptForm } from "@/components/transcript-form";
import { PageHeader } from "@/components/ui/misc";
import { getMeetingDetail, getMeetings } from "@/lib/access";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create from Transcript | NullToPlan",
};

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

export default async function TranscriptPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/projects");
  const { from } = await searchParams;
  const [sample, meetings, rerun] = await Promise.all([
    loadSample(),
    getMeetings(user, 5),
    from ? getMeetingDetail(user, from) : Promise.resolve(null),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI automation"
        title="Create from Transcript"
        description="Paste any technical meeting transcript. The AI turns it into projects and tasks with managers, developers, deadlines and estimated hours, and suggests an agenda for the next meeting."
      >
        <Button asChild variant="outline">
          <Link href="/admin/transcript/history">
            <History className="h-4 w-4" aria-hidden /> History
          </Link>
        </Button>
      </PageHeader>
      <TranscriptForm
        key={rerun?.id ?? "new"}
        sample={sample}
        initialText={rerun?.transcript || undefined}
        initialSource={rerun ? `Re-run of "${rerun.title}"` : undefined}
      />
      <RecentMeetings meetings={meetings} />
    </div>
  );
}
