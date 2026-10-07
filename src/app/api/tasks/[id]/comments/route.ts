import { NextResponse } from "next/server";
import { addComment, getComments } from "@/lib/access";
import { CommentRequest } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const comments = await getComments(user, id);
  if (!comments) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ comments });
}

export async function POST(req: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = CommentRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Write a message (up to 2,000 characters)." },
      { status: 400 },
    );
  }
  const { id } = await ctx.params;
  const comment = await addComment(user, id, parsed.data.body);
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ comment }, { status: 201 });
}
