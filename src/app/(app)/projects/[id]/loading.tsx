import { Skeleton } from "@/components/ui/misc";

export default function ProjectLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-5 w-28" />
      <div className="bg-card space-y-4 rounded-2xl border p-6 sm:p-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <div className="grid gap-5 border-t pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>
      <Skeleton className="h-6 w-32" />
      <div className="bg-card space-y-px overflow-hidden rounded-xl border">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  );
}
