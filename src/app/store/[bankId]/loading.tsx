import { Skeleton } from "@/components/ui/skeleton";
import { DetailCardSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-72 max-w-full" />
      <DetailCardSkeleton />
    </div>
  );
}
