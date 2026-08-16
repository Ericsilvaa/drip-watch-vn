"use client"

import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"
import { Copy, ImageIcon, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toneClass } from "@/components/dashboard/status-badge"
import { useInstanciaStatus } from "@/hooks/use-instancia-status"
import { LEMBRETES_API_ROUTE, DIAS_SEMANA_OPCOES } from "@/config/lembretes"
import { fmtProximoDisparo } from "@/lib/lembrete-preview"
import { fmtDataHora } from "@/lib/format"
import type { Lembrete } from "@/lib/types"
import { cn } from "@/lib/utils"

function resumoDias(dias: number[]): string {
  if (dias.length === 7) return "Todos os dias"
  return dias
    .slice()
    .sort()
    .map((d) => DIAS_SEMANA_OPCOES.find((o) => o.valor === d)?.label ?? "")
    .join(", ")
}

export function LembreteLinha({
  lembrete,
  onEditar,
}: {
  lembrete: Lembrete
  onEditar: () => void
}) {
  const [alternandoAtivo, setAlternandoAtivo] = useState(false)
  const [duplicando, setDuplicando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const { data: whatsapp } = useInstanciaStatus(false)

  async function alternarAtivo(novoValor: boolean) {
    if (novoValor && whatsapp?.state !== "open") {
      toast.error("WhatsApp desconectado — conecte em Configurações antes de ativar este lembrete.")
      return
    }
    setAlternandoAtivo(true)
    try {
      const resposta = await fetch(`${LEMBRETES_API_ROUTE}/${lembrete.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: novoValor }),
      })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao atualizar.")
        return
      }
      mutate(LEMBRETES_API_ROUTE)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet.")
    } finally {
      setAlternandoAtivo(false)
    }
  }

  async function duplicar() {
    setDuplicando(true)
    try {
      const { id: _id, criado_em: _criado, atualizado_em: _atualizado, ...resto } = lembrete
      const resposta = await fetch(LEMBRETES_API_ROUTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...resto, nome: `${lembrete.nome} (cópia)` }),
      })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao duplicar.")
        return
      }
      toast.success("Lembrete duplicado.")
      mutate(LEMBRETES_API_ROUTE)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet.")
    } finally {
      setDuplicando(false)
    }
  }

  async function excluir() {
    setExcluindo(true)
    try {
      const resposta = await fetch(`${LEMBRETES_API_ROUTE}/${lembrete.id}`, { method: "DELETE" })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao excluir.")
        return
      }
      toast.success("Lembrete excluído.")
      setConfirmandoExclusao(false)
      mutate(LEMBRETES_API_ROUTE)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet.")
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{lembrete.nome}</span>
          <span
            className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", toneClass[lembrete.ativo ? "success" : "neutral"])}
          >
            {lembrete.ativo ? "Ativo" : "Inativo"}
          </span>
          {lembrete.imagem_url ? (
            <span title="Tem imagem" className="text-muted-foreground">
              <ImageIcon className="size-3.5" />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
          {resumoDias(lembrete.dias_semana)} às {lembrete.horario.slice(0, 5)} · {lembrete.dias_apos_compra} dias após a compra
          {lembrete.quantidade_max ? ` · até ${lembrete.quantidade_max}/rodada` : ""}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Próximo disparo: {lembrete.ativo ? fmtProximoDisparo(lembrete.dias_semana, lembrete.horario) : "—"} · Alterado em{" "}
          {fmtDataHora(lembrete.atualizado_em)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Switch checked={lembrete.ativo} onCheckedChange={alternarAtivo} disabled={alternandoAtivo} aria-label="Ativar ou desativar" />
        <Button variant="ghost" size="icon-sm" onClick={onEditar} aria-label="Editar">
          <Pencil className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={duplicar} disabled={duplicando} aria-label="Duplicar">
          <Copy className="size-4" />
        </Button>
        <AlertDialog open={confirmandoExclusao} onOpenChange={setConfirmandoExclusao}>
          <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Excluir" />}>
            <Trash2 className="size-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir "{lembrete.nome}"?</AlertDialogTitle>
              <AlertDialogDescription>
                O lembrete para de disparar imediatamente. O histórico de envios que ele já fez continua no painel — só a configuração some.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={excluindo} onClick={excluir}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
