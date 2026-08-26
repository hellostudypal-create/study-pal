import { PageHeaderSkeleton } from "@/components/ui/loading-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withButton={false} />
      <Skeleton className="h-72 w-full rounded-md" />
    </div>
  );
}
