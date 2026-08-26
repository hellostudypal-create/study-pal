import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-11 w-full" />
      <CardGridSkeleton />
    </div>
  );
}
