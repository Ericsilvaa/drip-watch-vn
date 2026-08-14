"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Header } from "@/components/dashboard/header"
import { MinhaContaCard } from "@/components/configuracoes/minha-conta-card"
import { WhatsappIntegracaoCard } from "@/components/configuracoes/whatsapp-integracao-card"
import { PreferenciasCard } from "@/components/configuracoes/preferencias-card"
import type { PreferenciasPainel } from "@/config/dashboard"

export function Configuracoes({
  email,
  fullName,
  preferencias,
}: {
  email: string
  fullName: string
  preferencias: PreferenciasPainel
}) {
  return (
    <div className="min-h-svh bg-background">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="Voltar para o painel"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <h1 className="text-lg font-semibold tracking-tight text-foreground text-balance">Configurações</h1>
          </div>
          <p className="pl-9 text-sm text-muted-foreground text-pretty">
            Seus dados de acesso e o pareamento do WhatsApp.
          </p>
        </div>

        <MinhaContaCard email={email} fullName={fullName} />

        <WhatsappIntegracaoCard />

        <PreferenciasCard preferencias={preferencias} />
      </main>
    </div>
  )
}
