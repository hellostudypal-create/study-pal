import { Skeleton } from "@/components/ui/skeleton";
import { DetailCardSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <DetailCardSkeleton />
      <DetailCardSkeleton />
    </div>
  );
}
