"use client"

import { useState } from "react"
import { toast } from "sonner"
import { mutate } from "swr"
import { Image as ImageIcon, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUnidadesRaw } from "@/hooks/use-raw-data"
import { useInstanciaStatus } from "@/hooks/use-instancia-status"
import { renderizarPreview } from "@/lib/lembrete-preview"
import { renderizarWhatsappMarkup } from "@/lib/whatsapp-markup"
import { LembreteEditor } from "@/components/configuracoes/lembrete-editor"
import {
  DIAS_SEMANA_OPCOES,
  LEMBRETES_API_ROUTE,
  LEMBRETES_IMAGEM_API_ROUTE,
  LEMBRETE_IMAGEM_TAMANHO_MAX_MB,
  LEMBRETE_IMAGEM_TIPOS,
  MENSAGEM_PADRAO_NOVO_LEMBRETE,
  TETO_SEGURANCA_GLOBAL,
} from "@/config/lembretes"
import type { Lembrete } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FormState {
  nome: string
  unidade_id: string
  horario: string
  dias_semana: number[]
  dias_apos_compra: string
  quantidade_max: string
  mensagem_template: string
  imagem_url: string | null
  ativo: boolean
}

function estadoInicial(lembrete?: Lembrete): FormState {
  if (lembrete) {
    return {
      nome: lembrete.nome,
      unidade_id: lembrete.unidade_id ?? "",
      horario: lembrete.horario.slice(0, 5),
      dias_semana: lembrete.dias_semana,
      dias_apos_compra: String(lembrete.dias_apos_compra),
      quantidade_max: lembrete.quantidade_max !== null ? String(lembrete.quantidade_max) : "",
      mensagem_template: lembrete.mensagem_template ?? "",
      imagem_url: lembrete.imagem_url,
      ativo: lembrete.ativo,
    }
  }
  return {
    nome: "",
    unidade_id: "",
    horario: "09:00",
    dias_semana: [0, 1, 2, 3, 4, 5, 6],
    dias_apos_compra: "5",
    quantidade_max: "",
    mensagem_template: MENSAGEM_PADRAO_NOVO_LEMBRETE,
    imagem_url: null,
    ativo: true,
  }
}

export function LembreteForm({
  lembrete,
  onSalvo,
  onCancelar,
}: {
  lembrete?: Lembrete
  onSalvo: () => void
  onCancelar: () => void
}) {
  const [form, setForm] = useState<FormState>(() => estadoInicial(lembrete))
  const [salvando, setSalvando] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const { data: unidades } = useUnidadesRaw()
  const { data: whatsapp } = useInstanciaStatus(false)

  const editando = Boolean(lembrete)

  function atualizar<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function alternarDia(dia: number) {
    setForm((f) => ({
      ...f,
      dias_semana: f.dias_semana.includes(dia) ? f.dias_semana.filter((d) => d !== dia) : [...f.dias_semana, dia].sort(),
    }))
  }

  async function selecionarImagem(file: File | undefined | null) {
    if (!file) return
    if (!(LEMBRETE_IMAGEM_TIPOS as readonly string[]).includes(file.type)) {
      toast.error(`Formato não aceito. Use: ${LEMBRETE_IMAGEM_TIPOS.join(", ")}.`)
      return
    }
    if (file.size > LEMBRETE_IMAGEM_TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Imagem maior que ${LEMBRETE_IMAGEM_TAMANHO_MAX_MB}MB.`)
      return
    }
    setEnviandoImagem(true)
    try {
      const body = new FormData()
      body.append("arquivo", file, file.name)
      const resposta = await fetch(LEMBRETES_IMAGEM_API_ROUTE, { method: "POST", body })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao enviar imagem.")
        return
      }
      atualizar("imagem_url", data.url as string)
    } catch {
      toast.error("Não foi possível enviar a imagem. Verifique sua internet.")
    } finally {
      setEnviandoImagem(false)
    }
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Nome do lembrete é obrigatório.")
      return
    }
    if (!form.mensagem_template.trim() && !form.imagem_url) {
      toast.error("O lembrete precisa ter texto, imagem, ou os dois.")
      return
    }
    if (form.dias_semana.length === 0) {
      toast.error("Selecione ao menos um dia da semana.")
      return
    }
    if (form.ativo && whatsapp?.state !== "open") {
      toast.error("WhatsApp desconectado — conecte em Configurações antes de ativar este lembrete.")
      return
    }

    setSalvando(true)
    try {
      const payload = {
        nome: form.nome,
        unidade_id: form.unidade_id || null,
        horario: form.horario,
        dias_semana: form.dias_semana,
        dias_apos_compra: Number(form.dias_apos_compra),
        quantidade_max: form.quantidade_max ? Number(form.quantidade_max) : null,
        mensagem_template: form.mensagem_template,
        imagem_url: form.imagem_url,
        ativo: form.ativo,
      }
      const url = editando ? `${LEMBRETES_API_ROUTE}/${lembrete!.id}` : LEMBRETES_API_ROUTE
      const method = editando ? "PATCH" : "POST"
      const resposta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao salvar lembrete.")
        return
      }
      toast.success(editando ? "Lembrete atualizado." : "Lembrete criado.")
      mutate(LEMBRETES_API_ROUTE)
      onSalvo()
    } catch {
      toast.error("Não foi possível salvar. Verifique sua internet.")
    } finally {
      setSalvando(false)
    }
  }

  const diasAposCompraNum = Number(form.dias_apos_compra) || 0
  const quantidadeNum = form.quantidade_max ? Number(form.quantidade_max) : null
  const preview = renderizarPreview(form.mensagem_template || "", {
    diasAposCompra: diasAposCompraNum,
    horario: form.horario,
    diasSemana: form.dias_semana,
  })

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lembrete-nome">Nome do lembrete</Label>
            <Input
              id="lembrete-nome"
              value={form.nome}
              onChange={(e) => atualizar("nome", e.target.value)}
              placeholder="Ex: Lembrete padrão — 5 dias"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Unidade</Label>
            <Select value={form.unidade_id || "todas"} onValueChange={(v) => atualizar("unidade_id", v === "todas" || !v ? "" : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as unidades</SelectItem>
                {(unidades ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lembrete-horario">Horário</Label>
              <Input id="lembrete-horario" type="time" value={form.horario} onChange={(e) => atualizar("horario", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lembrete-dias-compra">Dias após a compra</Label>
              <Input
                id="lembrete-dias-compra"
                type="number"
                min={1}
                value={form.dias_apos_compra}
                onChange={(e) => atualizar("dias_apos_compra", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Dia da semana</Label>
            <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-0.5">
              {DIAS_SEMANA_OPCOES.map((d) => (
                <button
                  key={d.valor}
                  type="button"
                  onClick={() => alternarDia(d.valor)}
                  aria-pressed={form.dias_semana.includes(d.valor)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    form.dias_semana.includes(d.valor)
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lembrete-quantidade">Quantidade de envios (teto por rodada)</Label>
            <Input
              id="lembrete-quantidade"
              type="number"
              min={1}
              placeholder="Sem teto próprio"
              value={form.quantidade_max}
              onChange={(e) => atualizar("quantidade_max", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {quantidadeNum && quantidadeNum > TETO_SEGURANCA_GLOBAL
                ? `Acima de ${TETO_SEGURANCA_GLOBAL} não tem efeito — esse é o teto de segurança global (todos os lembretes somados por execução).`
                : `Nunca ultrapassa o teto de segurança global de ${TETO_SEGURANCA_GLOBAL} envios por execução.`}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Imagem (opcional)</Label>
            {form.imagem_url ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imagem_url} alt="Imagem do lembrete" className="size-14 rounded-md object-cover" />
                <p className="flex-1 truncate text-xs text-muted-foreground">Imagem anexada</p>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => atualizar("imagem_url", null)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
                {enviandoImagem ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                {enviandoImagem ? "Enviando…" : "Escolher imagem (jpeg, png, webp — até 5MB)"}
                <input
                  type="file"
                  accept={LEMBRETE_IMAGEM_TIPOS.join(",")}
                  className="sr-only"
                  onChange={(e) => selecionarImagem(e.target.files?.[0])}
                  disabled={enviandoImagem}
                />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mensagem</Label>
            <LembreteEditor value={form.mensagem_template} onChange={(v) => atualizar("mensagem_template", v)} />
          </div>

          <div className="flex items-center gap-2.5">
            <Switch id="lembrete-ativo" checked={form.ativo} onCheckedChange={(v) => atualizar("ativo", v)} />
            <Label htmlFor="lembrete-ativo" className="cursor-pointer text-sm text-muted-foreground">
              Lembrete ativo
            </Label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Preview</Label>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Simulação com dados de exemplo — não é uma mensagem real.</p>
            <div className="flex flex-col gap-2 rounded-xl bg-[#dcf8c6] p-3">
              {form.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imagem_url} alt="Preview da imagem" className="w-full rounded-lg object-cover" />
              ) : null}
              <p className="whitespace-pre-wrap text-sm text-[#1a2233]">
                {preview ? renderizarWhatsappMarkup(preview) : "Sua mensagem aparece aqui…"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancelar} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="button" size="sm" className="gap-1.5" onClick={salvar} disabled={salvando}>
          {salvando ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Salvar lembrete
        </Button>
      </div>
    </div>
  )
}
