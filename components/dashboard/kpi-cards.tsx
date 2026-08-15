"use client"

import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react"
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

/**
 * Pra KPIs "quanto maior, melhor" (default/success) subir é bom; pro de
 * falhas (tone error) subir é ruim — inverte a cor do selo sem inventar dado novo.
 */
function DeltaPill({ deltaPercent, tone }: { deltaPercent: number | null | undefined; tone: Kpi["tone"] }) {
  if (deltaPercent === null || deltaPercent === undefined) return null
  const subiu = deltaPercent > 0
  const estavel = Math.abs(deltaPercent) < 0.5
  const positivoParaONegocio = tone === "error" ? !subiu : subiu
  const corClasse = estavel
    ? "bg-status-neutral-bg text-status-neutral"
    : positivoParaONegocio
      ? "bg-status-success-bg text-status-success"
      : "bg-status-error-bg text-status-error"

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", corClasse)}>
      {!estavel ? subiu ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" /> : null}
      {estavel ? "estável" : `${subiu ? "+" : ""}${deltaPercent.toFixed(1).replace(".", ",")}%`}
    </span>
  )
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div
      className={cn(
        "card-elevated flex flex-col gap-3 rounded-2xl bg-card p-4",
        kpi.alerta && "ring-1 ring-status-error/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
        {kpi.alerta ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-error-bg px-2 py-0.5 text-xs font-medium text-status-error">
            <AlertTriangle className="size-3" />
            Alerta
          </span>
        ) : (
          <DeltaPill deltaPercent={kpi.deltaPercent} tone={kpi.tone} />
        )}
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

      <div className="flex items-center justify-between gap-2">
        {kpi.apoio ? <p className="text-xs text-muted-foreground">{kpi.apoio}</p> : <span />}
        {kpi.alerta ? <DeltaPill deltaPercent={kpi.deltaPercent} tone={kpi.tone} /> : null}
      </div>
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
