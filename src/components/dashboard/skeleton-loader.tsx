import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonLoader() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-40 mt-1" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-3 w-28 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="flex justify-between items-baseline">
            <Skeleton className="h-9 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-center pt-1">
            <Skeleton className="h-4 w-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52 mt-1" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent className="px-6 pt-0">
            <div className="space-y-4 py-2">
                {[...Array(5)].map((_, i) => (
                    <div className="flex items-center space-x-4" key={i}>
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <div className="w-16">
                            <Skeleton className="h-5 w-full" />
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-6 w-6" />
                    </div>
                ))}
            </div>
            <div className="p-0 pt-1 flex justify-center">
                <Skeleton className="h-4 w-8" />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
