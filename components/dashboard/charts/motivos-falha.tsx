"use client"

import { useMotivosFalha } from "@/hooks/use-motivos-falha"
import { fmtNumero, fmtPercent } from "@/lib/format"
import { AsyncBoundary } from "@/components/dashboard/state"

export function MotivosFalha() {
  const { motivos, isLoading, error } = useMotivosFalha()
  const max = Math.max(1, ...motivos.map((m) => m.contagem))

  return (
    <AsyncBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={motivos.length === 0}
      emptyMessage="Nenhuma falha registrada no período. Ótimo sinal."
      loadingClassName="h-[220px]"
    >
      <ul className="flex flex-col gap-3">
        {motivos.map((m) => (
          <li key={m.motivo} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-foreground">{m.motivo}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {fmtNumero(m.contagem)} · {fmtPercent(m.percentual)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-status-error"
                style={{ width: `${(m.contagem / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </AsyncBoundary>
  )
}
