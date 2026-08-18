"use client"

import { Menu } from "lucide-react"

function saudacao(d = new Date()) {
  const h = d.getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
})

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const hoje = dataLonga.format(new Date())

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-lg border border-border p-2 text-foreground hover:bg-muted lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground text-balance sm:text-xl">
            {saudacao()}, equipe Lavateria
          </h1>
          <p className="truncate text-sm text-muted-foreground first-letter:uppercase">
            {hoje} · acompanhe os disparos de recompra por WhatsApp
          </p>
        </div>

        <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-status-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-status-success" />
          </span>
          Dados ao vivo
        </span>
      </div>
    </header>
  )
}
