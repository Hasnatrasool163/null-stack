import { Skeleton } from "@/components/ui/misc";

export function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function Loading({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading">
      <HeaderSkeleton />
      {children}
    </div>
  );
}
