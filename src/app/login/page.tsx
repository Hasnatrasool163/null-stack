import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FileText, FolderKanban, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in | NovaWorks" };

const POINTS = [
  { icon: FileText, text: "Turn meeting transcripts into projects and tasks with AI." },
  { icon: FolderKanban, text: "Managers see their projects, developers see their work." },
  { icon: ShieldCheck, text: "Role-based access enforced on the server." },
];

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "AGENT" ? "/my-tasks" : "/projects");
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="bg-sidebar relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-48 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]"
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-bold shadow-lg shadow-indigo-500/40">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight">NovaWorks</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h2 className="animate-fade-up text-4xl leading-tight font-semibold tracking-tight">
            From meeting to project plan in under a minute.
          </h2>
          <ul className="stagger mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/10 text-indigo-300 ring-1 ring-white/10">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sidebar-muted relative mt-16 text-xs">NovaWorks CRM</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="animate-fade-up w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-lg shadow-indigo-500/30">
              N
            </span>
            <span className="text-lg font-semibold tracking-tight">NovaWorks</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
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
