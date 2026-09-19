import { Skeleton } from "@/components/ui/skeleton"

export function AppShellSkeleton() {
  return (
    <div className="min-h-svh app-glow">
      <aside
        className="fixed inset-y-3 left-3 z-40 hidden w-64 flex-col rounded-3xl border border-border/60 bg-sidebar shadow-[0_12px_40px_-16px_rgba(19,63,198,0.28)] lg:flex"
        aria-hidden
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-3 py-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>

        <div className="p-3">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>
      </aside>

      <div className="flex min-h-svh flex-col lg:pl-[17.25rem]">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
            <Skeleton className="size-9 rounded-xl lg:hidden" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8" aria-busy aria-live="polite">
          <span className="sr-only">Carregando página…</span>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
        </main>
      </div>
    </div>
  )
}
