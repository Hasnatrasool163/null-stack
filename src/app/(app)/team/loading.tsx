import { Loading } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/misc";

export default function TeamLoading() {
  return (
    <Loading>
      {[1, 3, 6].map((n, s) => (
        <div key={s} className="space-y-4">
          <Skeleton className="h-3 w-36" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: n }, (_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </Loading>
  );
}
