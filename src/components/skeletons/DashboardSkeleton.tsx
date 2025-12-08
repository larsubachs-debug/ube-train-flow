import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-pulse">
      {/* Welcome section */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Today's workout */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StreakSkeleton() {
  return (
    <div className="flex items-center gap-2 animate-pulse">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-5 w-8" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}
