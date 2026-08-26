import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton, DetailCardSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-32" />
      <StatCardsSkeleton />
      <DetailCardSkeleton />
      <DetailCardSkeleton />
    </div>
  );
}
