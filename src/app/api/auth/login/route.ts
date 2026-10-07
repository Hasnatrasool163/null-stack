import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { createSession } from "@/lib/session";
import { LoginRequest } from "@/lib/schemas";
import type { Role } from "@/lib/types";

export const runtime = "nodejs";

// Compared against when the email is unknown, so timing does not reveal accounts.
const DUMMY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.4tZb2rQ1Zr9mXkKxkq0e8k3f2Wv2";

export async function POST(req: Request) {
  const parsed = LoginRequest.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 },
    );
  }
  const { email, password } = parsed.data;
  const rows = await query<{
    id: string;
    role: Role;
    password_hash: string;
  }>("SELECT id, role, password_hash FROM users WHERE lower(email) = lower($1)", [
    email,
  ]);
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }
  await createSession(user.id);
  return NextResponse.json({
    redirectTo: user.role === "AGENT" ? "/my-tasks" : "/projects",
  });
}
