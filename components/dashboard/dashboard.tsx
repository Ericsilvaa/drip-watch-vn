"use client"

import { ComparativoUnidades } from "@/components/dashboard/charts/comparativo-unidades"
import { EnviosPorDiaChart } from "@/components/dashboard/charts/envios-por-dia-chart"
import { MotivosFalha } from "@/components/dashboard/charts/motivos-falha"
import { StatusDonut } from "@/components/dashboard/charts/status-donut"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { Header } from "@/components/dashboard/header"
import { HistoricoTable } from "@/components/dashboard/historico-table"
import { ImportacoesPanel } from "@/components/dashboard/importacoes-panel"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { RecentTable } from "@/components/dashboard/recent-table"
import { SectionCard } from "@/components/dashboard/section-card"
import { Button } from "@/components/ui/button"
import type { PreferenciasPainel } from "@/config/dashboard"
import { DashboardFiltersProvider } from "@/hooks/use-dashboard-filters"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"

/** Revalida os 4 datasets brutos (mesmas chaves de hooks/use-raw-data.ts) — sem novo endpoint, só força o SWR a rebuscar. */
function AtualizarButton() {
  const [atualizando, setAtualizando] = useState(false)

  async function atualizar() {
    setAtualizando(true)
    try {
      await Promise.all([mutate("unidades"), mutate("clientes"), mutate("envios"), mutate("importacoes")])
      toast.success("Dados atualizados.")
    } finally {
      setAtualizando(false)
    }
  }

  return (
    <Button onClick={atualizar} disabled={atualizando} className="gap-1.5 rounded-full">
      <RefreshCw className={cn("size-4", atualizando && "animate-spin")} />
      Atualizar dados
    </Button>
  )
}

function saudacao(): string {
  const hora = new Date().getHours()
  if (hora < 12) return "Bom dia"
  if (hora < 18) return "Boa tarde"
  return "Boa noite"
}

export function Dashboard({
  preferencias,
  fullName,
}: {
  preferencias: PreferenciasPainel
  fullName?: string
}) {
  const primeiroNome = fullName?.trim().split(" ")[0]

  return (
    <DashboardFiltersProvider preferencias={preferencias}>
      <div className="app-glow min-h-svh">
        <Header />

        <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold tracking-tight text-foreground text-balance">
                {saudacao()}
                {primeiroNome ? `, ${primeiroNome}!` : " — Painel de disparos"}
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Acompanhamento da régua de recompra por WhatsApp — lembrete 5 dias após a última compra.
              </p>
            </div>
            <AtualizarButton />
          </div>

          <FilterBar />

          <KpiCards />

          {/* <StatusHighlightCard /> */}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Disparos por dia"
              description="Últimos 7 dias, por status"
              className="lg:col-span-2"
            >
              <EnviosPorDiaChart />
            </SectionCard>

            <SectionCard title="Entregues x Falhas" description="No período selecionado">
              <StatusDonut />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Comparativo entre unidades"
              description="Cambeba x Guararapes no período"
              className="lg:col-span-2"
            >
              <ComparativoUnidades />
            </SectionCard>

            <SectionCard title="Motivos de falha" description="Ranking no período">
              <MotivosFalha />
            </SectionCard>
          </div>

          <SectionCard title="Envios recentes" description="Filtre por status de entrega">
            <RecentTable />
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <SectionCard
              title="Histórico de disparos"
              description="Todos os disparos, com total por cliente e marcação multi-unidade"
              className="lg:col-span-2"
            >
              <HistoricoTable />
            </SectionCard>

            <SectionCard title="Importações recentes" description="Cargas de clientes por unidade">
              <ImportacoesPanel />
            </SectionCard>
          </div>
        </main>
      </div>
    </DashboardFiltersProvider>
  )
}
