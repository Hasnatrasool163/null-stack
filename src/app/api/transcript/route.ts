import { NextResponse } from "next/server";
import { createFromTranscript } from "@/lib/create-from-transcript";
import { TranscriptRequest } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, errors: [{ where: "Access", message: "Not signed in." }] },
      { status: 401 },
    );
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        ok: false,
        errors: [{ where: "Access", message: "Admins only." }],
      },
      { status: 403 },
    );
  }
  const parsed = TranscriptRequest.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: [
          {
            where: "Transcript",
            message:
              "The transcript is missing or too long (max 30,000 characters).",
          },
        ],
      },
      { status: 400 },
    );
  }
  const result = await createFromTranscript(
    user,
    parsed.data.transcript,
    parsed.data.onDuplicate,
    parsed.data.sourceName,
  );
  if (result.ok) return NextResponse.json(result);
  return NextResponse.json(
    {
      ok: false,
      reason: result.reason,
      errors: result.errors,
      insights: result.insights,
      duplicate: result.duplicate,
    },
    { status: result.status },
  );
}
