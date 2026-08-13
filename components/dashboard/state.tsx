import type { ReactNode } from "react"
import { AlertTriangle, Inbox } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <AlertTriangle className="size-5 text-destructive" />
      <p className="text-sm font-medium text-foreground">Não foi possível carregar</p>
      <p className="text-xs text-muted-foreground">{message ?? "Tente novamente em instantes."}</p>
    </div>
  )
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-10 text-center">
      <Inbox className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message ?? "Nenhum dado no período selecionado."}</p>
    </div>
  )
}

export function LoadingBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("w-full rounded-lg", className)} />
}

export function AsyncBoundary({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  loadingClassName,
  children,
}: {
  isLoading: boolean
  error?: unknown
  isEmpty?: boolean
  emptyMessage?: string
  loadingClassName?: string
  children: ReactNode
}) {
  if (isLoading) return <LoadingBlock className={loadingClassName ?? "h-40"} />
  if (error) return <ErrorState message={error instanceof Error ? error.message : undefined} />
  if (isEmpty) return <EmptyState message={emptyMessage} />
  return <>{children}</>
}
