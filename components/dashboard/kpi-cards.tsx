"use client"

import { AlertTriangle } from "lucide-react"
import { useKPIs, type Kpi } from "@/hooks/use-kpis"
import { fmtNumero } from "@/lib/format"
import { Sparkline } from "@/components/dashboard/sparkline"
import { ErrorState, LoadingBlock } from "@/components/dashboard/state"
import { cn } from "@/lib/utils"

const toneColor: Record<Kpi["tone"], string> = {
  default: "var(--color-primary)",
  success: "var(--color-status-success)",
  error: "var(--color-status-error)",
  neutral: "var(--color-status-neutral)",
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4",
        kpi.alerta ? "border-status-error/40" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
        {kpi.alerta ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-error-bg px-2 py-0.5 text-xs font-medium text-status-error">
            <AlertTriangle className="size-3" />
            Alerta
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            kpi.tone === "error" && kpi.valor > 0 ? "text-status-error" : "text-foreground",
          )}
        >
          {fmtNumero(kpi.valor)}
        </span>
        <Sparkline data={kpi.trend} color={toneColor[kpi.tone]} className="shrink-0" />
      </div>

      {kpi.apoio ? <p className="text-xs text-muted-foreground">{kpi.apoio}</p> : null}
    </div>
  )
}

export function KpiCards() {
  const { kpis, isLoading, error } = useKPIs()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingBlock key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error.message} />

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
