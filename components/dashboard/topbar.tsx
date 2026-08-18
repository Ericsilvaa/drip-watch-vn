"use client"

import { useState } from "react"
import { Menu, RefreshCw } from "lucide-react"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"

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

const CHAVES = ["unidades", "clientes", "envios", "importacoes"]

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const hoje = dataLonga.format(new Date())
  const { mutate } = useSWRConfig()
  const [atualizando, setAtualizando] = useState(false)

  async function atualizar() {
    setAtualizando(true)
    await Promise.all(CHAVES.map((k) => mutate(k)))
    setAtualizando(false)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-xl border border-border p-2 text-foreground hover:bg-muted lg:hidden"
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

        <button
          type="button"
          onClick={atualizar}
          disabled={atualizando}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-[0_8px_20px_-8px_rgba(19,63,198,0.6)] transition-all hover:brightness-110 disabled:opacity-70",
          )}
        >
          <RefreshCw className={cn("size-4", atualizando && "animate-spin")} />
          <span className="hidden sm:inline">{atualizando ? "Atualizando" : "Atualizar"}</span>
        </button>
      </div>
    </header>
  )
}
