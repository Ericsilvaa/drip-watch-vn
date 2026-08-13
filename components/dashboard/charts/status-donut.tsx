"use client"

import { Cell, Label, Pie, PieChart } from "recharts"
import { useStatusDisparos } from "@/hooks/use-status-disparos"
import { fmtNumero, fmtPercent } from "@/lib/format"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AsyncBoundary } from "@/components/dashboard/state"

const config = {
  enviado: { label: "Entregues", color: "var(--color-status-success)" },
  erro: { label: "Falhas", color: "var(--color-status-error)" },
} satisfies ChartConfig

export function StatusDonut() {
  const { fatias, total, isLoading, error } = useStatusDisparos()
  const sucesso = fatias.find((f) => f.chave === "enviado")

  return (
    <AsyncBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={total === 0}
      emptyMessage="Sem tentativas de entrega no período."
      loadingClassName="h-[260px]"
    >
      <div className="flex flex-col items-center gap-4">
        <ChartContainer config={config} className="aspect-square h-[200px]">
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="chave" hideLabel />}
            />
            <Pie data={fatias} dataKey="valor" nameKey="chave" innerRadius={58} outerRadius={82} strokeWidth={2}>
              {fatias.map((f) => (
                <Cell key={f.chave} fill={f.cor} stroke="var(--color-card)" />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-2xl font-semibold">
                        {sucesso ? fmtPercent(sucesso.percentual) : "—"}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-muted-foreground text-xs">
                        taxa de sucesso
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="grid w-full grid-cols-2 gap-2">
          {fatias.map((f) => (
            <div key={f.chave} className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: f.cor }} aria-hidden="true" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs text-muted-foreground">{f.label}</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">{fmtNumero(f.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AsyncBoundary>
  )
}
