import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CalendarCheck,
  FileText,
  KanbanSquare,
  ShieldCheck,
} from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in | NullToPlan" };

const POINTS = [
  {
    icon: FileText,
    text: "Turn any meeting transcript into projects and tasks.",
  },
  {
    icon: CalendarCheck,
    text: "Get open questions and a suggested agenda for the next meeting.",
  },
  {
    icon: KanbanSquare,
    text: "Track every task on a board, with its own discussion thread.",
  },
  { icon: ShieldCheck, text: "Everyone sees exactly what their role allows." },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "AGENT" ? "/my-tasks" : "/projects");
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="bg-accent/50 relative hidden overflow-hidden border-r p-12 lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,118,110,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.07)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_30%_60%,black_30%,transparent_75%)] bg-[size:40px_40px]"
        />
        <Logo className="relative" />
        <div className="relative mt-auto max-w-md">
          <p className="text-primary font-mono text-xs tracking-wider">
            null → plan
          </p>
          <h2 className="animate-fade-up mt-3 text-4xl leading-[1.15] font-semibold tracking-tight">
            From a messy meeting to a clear plan in under a minute.
          </h2>
          <ul className="stagger mt-10 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="text-muted-foreground flex items-start gap-3 text-sm"
              >
                <span className="bg-card text-primary border-primary/15 grid h-8 w-8 shrink-0 place-items-center rounded-lg border">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground relative mt-16 text-xs">
          NullToPlan · AI meeting-to-project CRM
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-fade-up w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sign in to see your projects and tasks.
          </p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
