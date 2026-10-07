import { NextResponse } from "next/server";
import { getBoardTasks } from "@/lib/access";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({ tasks: await getBoardTasks(user) });
}
