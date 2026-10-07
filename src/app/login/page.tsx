import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in | NovaWorks" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "AGENT" ? "/my-tasks" : "/projects");
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">NovaWorks CRM</CardTitle>
          <CardDescription>Sign in to see your projects and tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
