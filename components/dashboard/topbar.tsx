"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Menu, RefreshCw } from "lucide-react"
import { useSWRConfig } from "swr"
import { cn } from "@/lib/utils"

const CHAVES = ["dashboard-data", "unidades", "templates"]

export function Topbar({
  onOpenMenu,
  title,
  subtitle,
  actions,
}: {
  onOpenMenu: () => void
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
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
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground first-letter:uppercase">{subtitle}</p>
          )}
        </div>

        {actions}

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
