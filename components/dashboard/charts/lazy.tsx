"use client"

/**
 * Wrappers client-only pros dois gráficos recharts do dashboard. Isolados
 * num arquivo "use client" próprio pra poder usar `ssr: false` — essa opção
 * do next/dynamic não é permitida direto num Server Component, e os dois já
 * dependem de useDashboardFilters()/SWR (client-only), então não há nada de
 * útil pra renderizar no servidor mesmo. Mantém recharts fora do chunk
 * inicial da página.
 */
import dynamic from "next/dynamic"
import { LoadingBlock } from "@/components/dashboard/state"

export const EnviosPorDiaChart = dynamic(
  () => import("@/components/dashboard/charts/envios-por-dia-chart").then((m) => m.EnviosPorDiaChart),
  { ssr: false, loading: () => <LoadingBlock className="h-[260px]" /> },
)

export const StatusDonut = dynamic(
  () => import("@/components/dashboard/charts/status-donut").then((m) => m.StatusDonut),
  { ssr: false, loading: () => <LoadingBlock className="h-[260px]" /> },
)
