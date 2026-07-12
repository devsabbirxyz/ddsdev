/**
 * Shimmer skeleton for product grids and list pages while data loads.
 */
export function ProductGridSkeleton({ count = 6, columns = "sm:grid-cols-2 xl:grid-cols-3" }: { count?: number; columns?: string }) {
  return (
    <div className={`grid ${columns} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] w-full bg-gradient-to-br from-muted/40 to-muted/10 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted/40 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-muted/30 animate-pulse" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-20 rounded bg-muted/40 animate-pulse" />
              <div className="h-8 w-20 rounded-lg bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-lg bg-muted/40 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-muted/40 animate-pulse" />
            <div className="h-3 w-1/3 rounded bg-muted/30 animate-pulse" />
          </div>
          <div className="h-6 w-16 rounded bg-muted/30 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
