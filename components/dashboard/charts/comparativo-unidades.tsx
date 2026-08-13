"use client"

import { useComparativoUnidades } from "@/hooks/use-comparativo-unidades"
import { META_TAXA_SUCESSO } from "@/config/dashboard"
import { fmtNumero, fmtPercent } from "@/lib/format"
import { AsyncBoundary } from "@/components/dashboard/state"
import { cn } from "@/lib/utils"

export function ComparativoUnidades() {
  const { comparativo, isLoading, error } = useComparativoUnidades()

  return (
    <AsyncBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={comparativo.length === 0}
      loadingClassName="h-[220px]"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {comparativo.map((u) => {
          const atingiuMeta = Number.isFinite(u.taxaSucesso) && u.taxaSucesso >= META_TAXA_SUCESSO
          return (
            <div
              key={u.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 transition-opacity",
                u.esmaecida && "opacity-45",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{u.nome}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    atingiuMeta
                      ? "bg-status-success-bg text-status-success"
                      : "bg-status-error-bg text-status-error",
                  )}
                >
                  {fmtPercent(u.taxaSucesso)}
                </span>
              </div>

              <div className="flex items-end gap-4">
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">{fmtNumero(u.enviado)}</p>
                  <p className="text-xs text-muted-foreground">entregues</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-muted-foreground">{fmtNumero(u.opt_out)}</p>
                  <p className="text-xs text-muted-foreground">opt-outs</p>
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", atingiuMeta ? "bg-status-success" : "bg-status-error")}
                  style={{ width: `${Number.isFinite(u.taxaSucesso) ? u.taxaSucesso * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Meta de sucesso: {fmtPercent(META_TAXA_SUCESSO)}
              </p>
            </div>
          )
        })}
      </div>
    </AsyncBoundary>
  )
}
