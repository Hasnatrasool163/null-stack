import { Loading } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/misc";

export default function HistoryLoading() {
  return (
    <Loading>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="bg-card space-y-px overflow-hidden rounded-xl border">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </Loading>
  );
}
