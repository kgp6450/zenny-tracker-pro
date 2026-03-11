import { Skeleton } from '@/components/ui/skeleton';

export const SkeletonDashboard = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header skeleton */}
      <header className="px-5 pt-12 pb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div>
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-9 h-9 rounded-lg" />
            <Skeleton className="w-9 h-9 rounded-lg" />
          </div>
        </div>
      </header>

      <main className="px-5 space-y-7">
        {/* Period Navigator skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="w-8 h-8 rounded-full" />
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Summary card skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-36" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center gap-4">
          <Skeleton className="h-5 w-32 self-start" />
          <Skeleton className="w-40 h-40 rounded-full" />
          <div className="flex flex-wrap gap-2 w-full">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>

        {/* Spending trends skeleton */}
        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>

        {/* Expenses list skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </main>

      {/* Bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around px-4 h-16 max-w-lg mx-auto">
          <Skeleton className="w-12 h-8 rounded-2xl" />
          <Skeleton className="w-14 h-14 rounded-full -mt-8" />
          <Skeleton className="w-12 h-8 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};
