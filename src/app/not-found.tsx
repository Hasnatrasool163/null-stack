import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="animate-fade-up flex max-w-md flex-col items-center text-center">
        <span className="bg-accent text-primary mb-5 grid h-14 w-14 place-items-center rounded-2xl">
          <SearchX className="h-7 w-7" aria-hidden />
        </span>
        <p className="text-primary text-sm font-semibold">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This page does not exist, or you do not have access to it.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to NovaWorks
          </Link>
        </Button>
      </div>
    </main>
  );
}
