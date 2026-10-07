import { NextResponse } from "next/server";
import { createTask } from "@/lib/access";
import { TaskCreate } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = TaskCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid task." },
      { status: 400 },
    );
  }
  const { id } = await ctx.params;
  const result = await createTask(user, id, parsed.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json({ task: result.value }, { status: 201 });
}
