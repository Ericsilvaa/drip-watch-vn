import { Skeleton } from "@/components/ui/skeleton"

/** Fallback do Suspense de rota (app/**\/loading.tsx) enquanto o Server Component checa a sessão. */
export function RouteLoading() {
  return (
    <div className="flex min-h-svh flex-col gap-6 bg-muted px-4 py-6 lg:px-8 lg:py-8">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
