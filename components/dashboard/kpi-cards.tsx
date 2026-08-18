"use client"

import {
  AlertTriangle,
  BellOff,
  CalendarClock,
  CheckCircle2,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"
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

const iconByKpi: Record<string, LucideIcon> = {
  total: Send,
  entregues: CheckCircle2,
  falhas: AlertTriangle,
  base: Users,
  optouts: BellOff,
  elegiveis: CalendarClock,
}

const chipTone: Record<Kpi["tone"], string> = {
  default: "bg-accent text-accent-foreground",
  success: "bg-status-success-bg text-status-success",
  error: "bg-status-error-bg text-status-error",
  neutral: "bg-status-neutral-bg text-status-neutral",
}

/** Variação simples: metade recente da série vs. metade anterior. */
function variacao(trend: number[]) {
  if (trend.length < 2) return null
  const meio = Math.floor(trend.length / 2)
  const ant = trend.slice(0, meio).reduce((a, b) => a + b, 0)
  const rec = trend.slice(meio).reduce((a, b) => a + b, 0)
  if (ant === 0 && rec === 0) return null
  if (ant === 0) return { pct: 100, up: true }
  const pct = ((rec - ant) / ant) * 100
  return { pct: Math.round(pct), up: pct >= 0 }
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = iconByKpi[kpi.id] ?? Send
  const v = variacao(kpi.trend)

  return (
    <div
      className={cn(
        "card-elevated flex flex-col gap-4 rounded-2xl border bg-card p-5",
        kpi.alerta ? "border-status-error/40" : "border-border/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex size-10 items-center justify-center rounded-xl", chipTone[kpi.tone])}>
          <Icon className="size-5" strokeWidth={2.1} />
        </span>
        {kpi.alerta ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-status-error-bg px-2 py-0.5 text-xs font-medium text-status-error">
            <AlertTriangle className="size-3" />
            Alerta
          </span>
        ) : v ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              v.up ? "bg-status-success-bg text-status-success" : "bg-status-error-bg text-status-error",
            )}
          >
            {v.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {v.up ? "+" : ""}
            {v.pct}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-muted-foreground">{kpi.label}</span>
        <span
          className={cn(
            "text-3xl font-bold tracking-tight tabular-nums",
            kpi.tone === "error" && kpi.valor > 0 ? "text-status-error" : "text-foreground",
          )}
        >
          {fmtNumero(kpi.valor)}
        </span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-2">
        {kpi.apoio ? <p className="text-xs text-muted-foreground text-pretty">{kpi.apoio}</p> : <span />}
        <Sparkline data={kpi.trend} color={toneColor[kpi.tone]} className="shrink-0" />
      </div>
    </div>
  )
}

export function KpiCards() {
  const { kpis, isLoading, error } = useKPIs()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingBlock key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    )
  }

  if (error) return <ErrorState message={error.message} />

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
