"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, Settings, Smartphone } from "lucide-react"
import { signOutAction } from "@/app/auth/actions"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { toneClass } from "@/components/dashboard/status-badge"
import { dashboardConfig } from "@/config/dashboard"
import { useInstanciaStatus } from "@/hooks/use-instancia-status"
import { cn } from "@/lib/utils"

function WhatsappStatusIndicator() {
  const cambeba = useInstanciaStatus("cambeba", false)
  const guararapes = useInstanciaStatus("guararapes", false)

  const carregando = !cambeba.data || !guararapes.data
  const conectado = cambeba.data?.state === "open" && guararapes.data?.state === "open"
  const desconectado = cambeba.data?.state === "close" || guararapes.data?.state === "close"

  const tone = carregando ? "neutral" : conectado ? "success" : desconectado ? "error" : "neutral"
  const label = carregando
    ? "Verificando conexão do WhatsApp…"
    : conectado
      ? "WhatsApp conectado"
      : desconectado
        ? "WhatsApp desconectado — verifique em Configurações"
        : "WhatsApp conectando…"

  return (
    <Link
      href="/configuracoes"
      title={label}
      aria-label={label}
      className={cn("flex size-7 items-center justify-center rounded-lg transition-opacity hover:opacity-80", toneClass[tone])}
    >
      <Smartphone className="size-4" />
    </Link>
  )
}

export function Header() {
  const pathname = usePathname()
  const emConfiguracoes = pathname?.startsWith("/configuracoes")

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="size-9 rounded-lg" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {dashboardConfig.appName}
              <span className="font-normal text-muted-foreground"> — {dashboardConfig.appBrand}</span>
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {dashboardConfig.appTagline}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <WhatsappStatusIndicator />

          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            aria-label="Configurações"
            className={cn(emConfiguracoes && "bg-accent text-accent-foreground")}
            render={<Link href="/configuracoes" aria-current={emConfiguracoes ? "page" : undefined} />}
          >
            <Settings className="size-4" />
          </Button>

          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
