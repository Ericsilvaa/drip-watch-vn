"use client"

import { DashboardFiltersProvider } from "@/hooks/use-dashboard-filters"
import { AppShell } from "@/components/dashboard/app-shell"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { SectionCard } from "@/components/dashboard/section-card"
import { EnviosPorDiaChart } from "@/components/dashboard/charts/envios-por-dia-chart"
import { StatusDonut } from "@/components/dashboard/charts/status-donut"

export function DashboardPage({ email }: { email: string }) {
  return (
    <DashboardFiltersProvider>
      <AppShell
        email={email}
        title="Bom acompanhamento, equipe Lavateria"
        subtitle="Visão geral dos disparos de recompra no período"
      >
        <FilterBar />

        <KpiCards />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SectionCard
            title="Disparos por dia"
            description="Volume e status no período"
            className="lg:col-span-2"
          >
            <EnviosPorDiaChart />
          </SectionCard>

          <SectionCard title="Entregues x Falhas" description="No período selecionado">
            <StatusDonut />
          </SectionCard>
        </div>
      </AppShell>
    </DashboardFiltersProvider>
  )
}
