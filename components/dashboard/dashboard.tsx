"use client"

import { useState } from "react"
import { DashboardFiltersProvider } from "@/hooks/use-dashboard-filters"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
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
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <DashboardFiltersProvider>
      <div className="min-h-svh app-glow">
        <Sidebar email={email} open={menuAberto} onClose={() => setMenuAberto(false)} />

        <div className="flex min-h-svh flex-col lg:pl-64">
          <Topbar onOpenMenu={() => setMenuAberto(true)} />

          <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">
            <FilterBar />

            {/* Visão geral */}
            <section id="visao-geral" className="scroll-mt-24 flex flex-col gap-6">
              <KpiCards />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            </section>

            {/* Disparos */}
            <section id="disparos" className="scroll-mt-24">
              <SectionCard title="Envios recentes" description="Filtre por status de entrega">
                <RecentTable />
              </SectionCard>
            </section>

            {/* Histórico + Importações */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section id="historico" className="scroll-mt-24 lg:col-span-2">
                <SectionCard
                  title="Histórico de disparos"
                  description="Todos os disparos, com total por cliente e marcação multi-unidade"
                >
                  <HistoricoTable />
                </SectionCard>
              </section>

              <section id="importacoes" className="scroll-mt-24">
                <SectionCard title="Importações recentes" description="Cargas de clientes por unidade">
                  <ImportacoesPanel />
                </SectionCard>
              </section>
            </div>
          </main>
        </div>
      </div>
    </DashboardFiltersProvider>
  )
}
