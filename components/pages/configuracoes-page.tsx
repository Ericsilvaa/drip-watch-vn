"use client"

import { AppShell } from "@/components/dashboard/app-shell"
import { SectionCard } from "@/components/dashboard/section-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EvolutionConnect } from "@/components/configuracoes/evolution-connect"
import { PreferenciasDashboard } from "@/components/configuracoes/preferencias-dashboard"

export function ConfiguracoesPage({ email }: { email: string }) {
  return (
    <AppShell
      email={email}
      title="Configurações"
      subtitle="Conexão do WhatsApp e preferências de exibição do painel"
    >
      <Tabs defaultValue="conexao" className="gap-6">
        <TabsList>
          <TabsTrigger value="conexao">Conexão WhatsApp</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências do painel</TabsTrigger>
        </TabsList>

        <TabsContent value="conexao">
          <SectionCard
            title="Evolution API"
            description="Conecte o número que enviará os disparos via QR Code"
          >
            <EvolutionConnect />
          </SectionCard>
        </TabsContent>

        <TabsContent value="preferencias">
          <SectionCard
            title="Exibição do dashboard"
            description="Ajuste como o painel abre para a sua equipe"
          >
            <PreferenciasDashboard />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
