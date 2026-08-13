"use client"

import { DashboardFiltersProvider } from "@/hooks/use-dashboard-filters"
import { Header } from "@/components/dashboard/header"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { SectionCard } from "@/components/dashboard/section-card"
import { EnviosPorDiaChart } from "@/components/dashboard/charts/envios-por-dia-chart"
import { StatusDonut } from "@/components/dashboard/charts/status-donut"
import { MotivosFalha } from "@/components/dashboard/charts/motivos-falha"
import { ComparativoUnidades } from "@/components/dashboard/charts/comparativo-unidades"
import { RecentTable } from "@/components/dashboard/recent-table"
import { HistoricoTable } from "@/components/dashboard/historico-table"
import { ImportacoesPanel } from "@/components/dashboard/importacoes-panel"

export function Dashboard({ email }: { email: string }) {
  return (
    <DashboardFiltersProvider>
      <div className="min-h-svh bg-background">
        <Header email={email} />

        <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground text-balance">
              Painel de disparos
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              Acompanhamento da régua de recompra por WhatsApp — lembrete 5 dias após a última compra.
            </p>
          </div>

          <FilterBar />

          <KpiCards />

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
