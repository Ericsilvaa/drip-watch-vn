"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useEnviosPorDia } from "@/hooks/use-envios-por-dia"
import { fmtDiaCurto } from "@/lib/format"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { AsyncBoundary } from "@/components/dashboard/state"

const config = {
  enviado: { label: "Entregues", color: "var(--color-status-success)" },
  erro: { label: "Falhas", color: "var(--color-status-error)" },
  opt_out_bloqueado: { label: "Opt-out", color: "var(--color-status-neutral)" },
} satisfies ChartConfig

export function EnviosPorDiaChart() {
  const { dados, isLoading, error } = useEnviosPorDia()
  const vazio = dados.every((d) => d.total === 0)

  return (
    <AsyncBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={vazio}
      emptyMessage="Nenhum disparo nos últimos 7 dias."
      loadingClassName="h-[260px]"
    >
      <ChartContainer config={config} className="h-[260px] w-full">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="dia"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(v) => fmtDiaCurto(v)}
            className="text-xs"
          />
          <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} className="text-xs" />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={(_, p) => fmtDiaCurto(String(p?.[0]?.payload?.dia ?? ""))} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="enviado" stackId="s" fill="var(--color-enviado)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="erro" stackId="s" fill="var(--color-erro)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="opt_out_bloqueado" stackId="s" fill="var(--color-opt_out_bloqueado)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </AsyncBoundary>
  )
}
