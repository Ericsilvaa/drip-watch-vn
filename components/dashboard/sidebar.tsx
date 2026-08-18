"use client"

import { useEffect, useState } from "react"
import { History, LayoutDashboard, LogOut, Send, Upload, X } from "lucide-react"
import { signOutAction } from "@/app/auth/actions"
import { Logo } from "@/components/brand/logo"
import { dashboardConfig } from "@/config/dashboard"
import { cn } from "@/lib/utils"

export const NAV_ITEMS = [
  { id: "visao-geral", label: "Visão geral", icon: LayoutDashboard },
  { id: "disparos", label: "Disparos", icon: Send },
  { id: "historico", label: "Histórico", icon: History },
  { id: "importacoes", label: "Importações", icon: Upload },
] as const

function iniciais(email: string) {
  const nome = email.split("@")[0] ?? ""
  const partes = nome.split(/[.\-_]/).filter(Boolean)
  const base = partes.length >= 2 ? partes[0][0] + partes[1][0] : nome.slice(0, 2)
  return base.toUpperCase()
}

export function Sidebar({
  email,
  open,
  onClose,
}: {
  email: string
  open: boolean
  onClose: () => void
}) {
  const [ativo, setAtivo] = useState<string>(NAV_ITEMS[0].id)

  useEffect(() => {
    const secoes = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    )
    if (!secoes.length) return

    const obs = new IntersectionObserver(
      (entries) => {
        const visivel = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visivel) setAtivo(visivel.target.id)
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    )
    secoes.forEach((s) => obs.observe(s))
    return () => obs.disconnect()
  }, [])

  return (
    <>
      {/* Overlay mobile */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300",
          "lg:inset-y-3 lg:left-3 lg:w-64 lg:translate-x-0 lg:rounded-3xl lg:border lg:border-border/60 lg:shadow-[0_12px_40px_-16px_rgba(19,63,198,0.28)]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Marca */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="icon-chip flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Logo className="size-8" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              {dashboardConfig.appBrand}
            </p>
            <p className="truncate text-xs text-muted-foreground">Régua de recompra</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2" aria-label="Navegação principal">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Painel
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isAtivo = ativo === item.id
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={onClose}
                aria-current={isAtivo ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isAtivo
                    ? "nav-active"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-[18px] shrink-0" strokeWidth={2.1} />
                {item.label}
                {isAtivo && <span className="ml-auto size-1.5 rounded-full bg-primary-foreground/80" />}
              </a>
            )
          })}
        </nav>

        {/* Perfil */}
        <div className="p-3">
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-secondary/60 px-2.5 py-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {iniciais(email)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{email}</p>
              <p className="text-xs text-muted-foreground">Equipe · leitura</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Sair"
                title="Sair"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
