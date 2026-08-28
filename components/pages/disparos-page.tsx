"use client"

import { DashboardFiltersProvider } from "@/hooks/use-dashboard-filters"
import { AppShell } from "@/components/dashboard/app-shell"
import { FilterBar } from "@/components/dashboard/filter-bar"
import { SectionCard } from "@/components/dashboard/section-card"
import { TemplatesList } from "@/components/disparos/templates-list"
import { RecentTable } from "@/components/dashboard/recent-table"
import { HistoricoTable } from "@/components/dashboard/historico-table"
import { ImportacoesPanel } from "@/components/dashboard/importacoes-panel"

export function DisparosPage({ email }: { email: string }) {
  return (
    <DashboardFiltersProvider>
      <AppShell
        email={email}
        title="Disparos"
        subtitle="Templates, envios recentes e histórico das mensagens de recompra"
      >
        {/* Templates + CRUD + Novo disparo */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 card-elevated">
          <TemplatesList />
        </section>

        <FilterBar />

        <SectionCard title="Envios recentes" description="Filtre por status de entrega">
          <RecentTable />
        </SectionCard>

        <SectionCard
          title="Importar clientes"
          description="Envie a planilha da unidade e acompanhe as últimas cargas"
        >
          <ImportacoesPanel />
        </SectionCard>

        <SectionCard
          title="Histórico de disparos"
          description="Todos os disparos, com total por cliente e marcação multi-unidade"
        >
          <HistoricoTable />
        </SectionCard>
      </AppShell>
    </DashboardFiltersProvider>
  )
}
