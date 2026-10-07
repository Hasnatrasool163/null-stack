import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { HistoryList } from "@/components/history/history-list";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/misc";
import { getMeetingHistory } from "@/lib/access";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Transcript history | NullToPlan" };

export default async function TranscriptHistoryPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/projects");
  const items = await getMeetingHistory(user);
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI automation"
        title="Transcript history"
        description="Every transcript that was analysed, including ones that were not relevant or needed fixes. Open one to see the original text, the AI's findings and the projects it created."
      >
        <Button asChild>
          <Link href="/admin/transcript">
            <Sparkles className="h-4 w-4" aria-hidden /> New transcript
          </Link>
        </Button>
      </PageHeader>
      <HistoryList items={items} />
    </div>
  );
}
