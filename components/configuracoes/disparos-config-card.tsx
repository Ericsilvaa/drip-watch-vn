"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { SectionCard } from "@/components/dashboard/section-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LembreteLinha } from "@/components/configuracoes/lembrete-linha"
import { LembreteForm } from "@/components/configuracoes/lembrete-form"
import { useLembretes } from "@/hooks/use-lembretes"
import type { Lembrete } from "@/lib/types"

type Modo = { tipo: "lista" } | { tipo: "novo" } | { tipo: "editar"; lembrete: Lembrete }

export function DisparosConfigCard() {
  const { lembretes, isLoading, error } = useLembretes()
  const [modo, setModo] = useState<Modo>({ tipo: "lista" })

  return (
    <SectionCard
      title="Configuração de Disparos"
      description="Lembretes de WhatsApp — dias após a compra, horário, mensagem e imagem, sem precisar mexer em código."
      action={
        modo.tipo === "lista" ? (
          <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setModo({ tipo: "novo" })}>
            <Plus className="size-4" />
            Novo lembrete
          </Button>
        ) : undefined
      }
    >
      {modo.tipo === "novo" ? (
        <LembreteForm onCancelar={() => setModo({ tipo: "lista" })} onSalvo={() => setModo({ tipo: "lista" })} />
      ) : modo.tipo === "editar" ? (
        <LembreteForm
          lembrete={modo.lembrete}
          onCancelar={() => setModo({ tipo: "lista" })}
          onSalvo={() => setModo({ tipo: "lista" })}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-status-error">{error.message}</p>
      ) : lembretes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lembrete configurado ainda.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {lembretes.map((l) => (
            <LembreteLinha key={l.id} lembrete={l} onEditar={() => setModo({ tipo: "editar", lembrete: l })} />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
