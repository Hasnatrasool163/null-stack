import { Loading } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/misc";

export default function BoardLoading() {
  return (
    <Loading>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid min-w-[60rem] grid-cols-4 gap-4 overflow-hidden">
        {[3, 2, 2, 1].map((n, i) => (
          <div key={i} className="space-y-2 rounded-xl border p-2">
            <Skeleton className="h-6 w-28" />
            {Array.from({ length: n }, (_, j) => (
              <Skeleton key={j} className="h-36 rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </Loading>
  );
}
