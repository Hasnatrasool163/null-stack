import { Loading } from "@/components/page-skeletons";
import { Skeleton } from "@/components/ui/misc";

export default function TranscriptLoading() {
  return (
    <Loading>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-[30rem] rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </Loading>
  );
}
