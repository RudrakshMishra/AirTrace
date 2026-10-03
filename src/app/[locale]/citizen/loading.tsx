import { Skeleton } from "@/components/ui";

export default function CitizenLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6 space-y-5">
      {/* Header controls skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Ward selector skeleton */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>

      {/* Hero AQI Card Skeleton */}
      <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-12 w-20 rounded-2xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
