import { PageHeaderSkeleton, DetailCardSkeleton } from "@/components/ui/loading-skeletons";

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withButton={false} />
      <DetailCardSkeleton />
    </div>
  );
}
