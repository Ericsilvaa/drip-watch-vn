"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Error boundary de rota (app/**\/error.tsx) — cobre falha do Server Component (ex.: outage do Supabase). */
export function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-muted px-4 text-center">
      <AlertTriangle className="size-8 text-destructive" />
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Não foi possível carregar o painel</p>
        <p className="text-sm text-muted-foreground">Tente novamente em instantes.</p>
      </div>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </div>
  )
}
