"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WhatsAppPreview } from "@/components/disparos/whatsapp-preview"
import { PLACEHOLDERS } from "@/config/dashboard"
import { contarCaracteres } from "@/lib/template-render"
import { criarTemplate, atualizarTemplate } from "@/app/templates/actions"
import type { Template, Unidade } from "@/lib/types"

const LIMITE = 2000

export function TemplateDialog({
  open,
  onOpenChange,
  template,
  unidades,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  template: Template | null
  unidades: Unidade[]
}) {
  const editando = Boolean(template)
  const { mutate } = useSWRConfig()

  const [nome, setNome] = useState(template?.nome ?? "")
  const [descricao, setDescricao] = useState(template?.descricao ?? "")
  const [corpo, setCorpo] = useState(template?.corpo ?? "")
  const [unidadeId, setUnidadeId] = useState<string>(template?.unidade_id ?? "todas")
  const [ativo, setAtivo] = useState(template?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)

  function inserirPlaceholder(chave: string) {
    setCorpo((c) => `${c}${c && !c.endsWith(" ") ? " " : ""}${chave} `)
  }

  async function salvar() {
    setSalvando(true)
    const payload = {
      nome,
      descricao: descricao || null,
      corpo,
      unidade_id: unidadeId === "todas" ? null : unidadeId,
      ativo,
    }
    const res = editando ? await atualizarTemplate(template!.id, payload) : await criarTemplate(payload)
    setSalvando(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success(editando ? "Template atualizado" : "Template criado")
    await mutate("templates")
    onOpenChange(false)
  }

  const caracteres = contarCaracteres(corpo)
  const excedeu = caracteres > LIMITE

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{editando ? "Editar template" : "Novo disparo"}</DialogTitle>
          <DialogDescription>
            Monte a mensagem e veja em tempo real como ela chega na conversa do WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_340px]">
          {/* Formulário */}
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-nome">Nome do template</Label>
              <Input
                id="tpl-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Lembrete de recompra (5 dias)"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
              <Input
                id="tpl-desc"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Para que serve este disparo"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-unidade">Unidade</Label>
              <Select value={unidadeId} onValueChange={(v) => setUnidadeId(v ?? "todas")}>
                <SelectTrigger id="tpl-unidade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as unidades</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-corpo">Mensagem</Label>
                <span className={excedeu ? "text-xs font-medium text-status-error" : "text-xs text-muted-foreground"}>
                  {caracteres}/{LIMITE}
                </span>
              </div>
              <Textarea
                id="tpl-corpo"
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                placeholder="Oi {{nome}}! Aqui é da {{unidade}}..."
                rows={7}
                className="resize-none font-sans"
                aria-invalid={excedeu}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Inserir:</span>
                {PLACEHOLDERS.map((p) => (
                  <button
                    key={p.chave}
                    type="button"
                    onClick={() => inserirPlaceholder(p.chave)}
                    className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10"
                    title={p.descricao}
                  >
                    {p.chave}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatação WhatsApp: <code>*negrito*</code>, <code>_itálico_</code>, <code>~tachado~</code>.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Template ativo</p>
                <p className="text-xs text-muted-foreground">Disponível para uso nos disparos</p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} aria-label="Template ativo" />
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-border bg-secondary/30 p-6 lg:border-l lg:border-t-0">
            <WhatsAppPreview corpo={corpo} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || excedeu}>
            {salvando && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {editando ? "Salvar alterações" : "Criar template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
