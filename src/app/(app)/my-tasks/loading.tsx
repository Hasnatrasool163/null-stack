import { Loading } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/misc";

export default function MyTasksLoading() {
  return (
    <Loading>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[7.5rem] rounded-xl" />
        ))}
      </div>
      {[0, 1].map((g) => (
        <div key={g} className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 rounded-xl" />
            <Skeleton className="h-44 rounded-xl" />
          </div>
        </div>
      ))}
    </Loading>
  );
}
