"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { MessageSquareText, Pencil, Plus, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { TemplateDialog } from "@/components/disparos/template-dialog"
import { useTemplatesRaw, useUnidadesRaw } from "@/hooks/use-raw-data"
import { aplicarExemplo } from "@/lib/template-render"
import { alternarAtivo, excluirTemplate } from "@/app/templates/actions"
import type { Template } from "@/lib/types"

export function TemplatesList() {
  const { data: templates, isLoading } = useTemplatesRaw()
  const { data: unidades } = useUnidadesRaw()
  const { mutate } = useSWRConfig()

  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Template | null>(null)
  const [aExcluir, setAExcluir] = useState<Template | null>(null)

  function novo() {
    setEmEdicao(null)
    setDialogAberto(true)
  }
  function editar(t: Template) {
    setEmEdicao(t)
    setDialogAberto(true)
  }

  async function toggle(t: Template, ativo: boolean) {
    await mutate(
      "templates",
      (prev?: Template[]) => prev?.map((x) => (x.id === t.id ? { ...x, ativo } : x)),
      false,
    )
    const res = await alternarAtivo(t.id, ativo)
    if (res?.error) {
      toast.error(res.error)
      await mutate("templates")
    }
  }

  async function confirmarExclusao() {
    if (!aExcluir) return
    const res = await excluirTemplate(aExcluir.id)
    if (res?.error) toast.error(res.error)
    else toast.success("Template excluído")
    setAExcluir(null)
    await mutate("templates")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Templates de mensagem</h2>
          <p className="text-sm text-muted-foreground">Modelos usados nos disparos de recompra</p>
        </div>
        <Button onClick={novo}>
          <Plus data-icon="inline-start" />
          Novo disparo
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : !templates?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <MessageSquareText className="size-8 text-muted-foreground" />
          <p className="mt-1 text-sm font-medium text-foreground">Nenhum template ainda</p>
          <p className="text-sm text-muted-foreground">Crie seu primeiro modelo de mensagem.</p>
          <Button className="mt-3" onClick={novo}>
            <Plus data-icon="inline-start" />
            Novo disparo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <article
              key={t.id}
              className="card-interactive flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{t.nome}</h3>
                  {t.descricao && (
                    <p className="truncate text-xs text-muted-foreground">{t.descricao}</p>
                  )}
                </div>
                <Badge variant={t.ativo ? "default" : "secondary"} className="shrink-0">
                  {t.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <p className="line-clamp-3 min-h-[3.75rem] text-sm text-muted-foreground">
                {aplicarExemplo(t.corpo)}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={t.ativo}
                    onCheckedChange={(v) => toggle(t, v)}
                    aria-label={`Ativar ${t.nome}`}
                  />
                  Ativo
                </label>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => editar(t)}>
                    <Pencil data-icon="inline-start" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAExcluir(t)}
                    aria-label={`Excluir ${t.nome}`}
                  >
                    <Trash2 className="text-status-error" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {dialogAberto && (
        <TemplateDialog
          open={dialogAberto}
          onOpenChange={setDialogAberto}
          template={emEdicao}
          unidades={unidades ?? []}
        />
      )}

      <AlertDialog open={Boolean(aExcluir)} onOpenChange={(v) => !v && setAExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
            <AlertDialogDescription>
              {aExcluir ? `"${aExcluir.nome}" será removido permanentemente.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
