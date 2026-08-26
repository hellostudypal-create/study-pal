import { Skeleton } from "@/components/ui/skeleton";
import { DetailCardSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <DetailCardSkeleton />
      <DetailCardSkeleton />
      <DetailCardSkeleton />
    </div>
  );
}
