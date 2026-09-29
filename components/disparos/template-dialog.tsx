"use client"

import { useEffect, useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { ImageIcon, Loader2, Users, X } from "lucide-react"
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
import {
  CAMPANHA_HORA_MAX,
  CAMPANHA_HORA_MIN,
  DIAS_SEMANA_OPCOES,
  IMAGEM_DISPARO_API_ROUTE,
  IMAGEM_DISPARO_TAMANHO_MAX_MB,
  IMAGEM_DISPARO_TIPOS,
  PLACEHOLDERS,
  TETO_DIARIO_CAMPANHA_PADRAO,
  TETO_SEGURANCA_GLOBAL,
} from "@/config/dashboard"
import { contarCaracteres } from "@/lib/template-render"
import { criarTemplate, atualizarTemplate, previaPublicoCampanha } from "@/app/templates/actions"
import type { PublicoCampanha, Template, TipoDisparo, Unidade } from "@/lib/types"
import { cn } from "@/lib/utils"

const LIMITE = 2000

const TIPOS: { valor: TipoDisparo; label: string; descricao: string }[] = [
  { valor: "regua", label: "Régua", descricao: "Lembrete automático X dias depois da compra, nos dias da semana escolhidos." },
  { valor: "campanha", label: "Campanha", descricao: "Promoção numa data escolhida, pra um público filtrado. Dispara uma vez por cliente." },
]

function hojeFortaleza(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date())
}

/** "" → null, senão número. Campos numéricos opcionais do form. */
function numeroOuNull(v: string): number | null {
  return v.trim() === "" ? null : Number(v)
}

function texto(v: number | null | undefined): string {
  return v === null || v === undefined ? "" : String(v)
}

/** Soma dias a uma data YYYY-MM-DD (meio-dia UTC evita virar o dia por fuso). */
function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** YYYY-MM-DD → DD/MM */
function ddmm(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`
}

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
  const [horario, setHorario] = useState(template?.horario?.slice(0, 5) ?? "09:00")
  const [diasSemana, setDiasSemana] = useState<number[]>(template?.dias_semana ?? [0, 1, 2, 3, 4, 5, 6])
  const [diasAposCompra, setDiasAposCompra] = useState(String(template?.dias_apos_compra ?? 5))
  const [mensagem, setMensagem] = useState(template?.mensagem_template ?? "")
  const [imagemUrl, setImagemUrl] = useState<string | null>(template?.imagem_url ?? null)
  const [quantidadeMax, setQuantidadeMax] = useState(
    template?.quantidade_max !== null && template?.quantidade_max !== undefined ? String(template.quantidade_max) : "",
  )
  const [unidadeId, setUnidadeId] = useState<string>(template?.unidade_id ?? "todas")
  const [ativo, setAtivo] = useState(template?.ativo ?? true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoImagem, setEnviandoImagem] = useState(false)

  // Campanha por data
  const [tipo, setTipo] = useState<TipoDisparo>(template?.tipo ?? "regua")
  const [dataInicio, setDataInicio] = useState(template?.data_inicio ?? "")
  const [dataFim, setDataFim] = useState(template?.data_fim ?? "")
  const [tetoDiario, setTetoDiario] = useState(texto(template?.teto_diario))
  const [diasSemCompraMin, setDiasSemCompraMin] = useState(texto(template?.publico_dias_sem_compra_min))
  const [diasSemCompraMax, setDiasSemCompraMax] = useState(texto(template?.publico_dias_sem_compra_max))
  const [comprasMin, setComprasMin] = useState(texto(template?.publico_compras_min))
  const [valorMin, setValorMin] = useState(texto(template?.publico_valor_min))
  const [aniversariantes, setAniversariantes] = useState(template?.publico_aniversariantes_mes ?? false)
  const [publicoTotal, setPublicoTotal] = useState<number | null>(null)
  const [carregandoPublico, setCarregandoPublico] = useState(false)
  const campanha = tipo === "campanha"

  const publico: PublicoCampanha = {
    unidade_id: unidadeId === "todas" ? null : unidadeId,
    publico_dias_sem_compra_min: numeroOuNull(diasSemCompraMin),
    publico_dias_sem_compra_max: numeroOuNull(diasSemCompraMax),
    publico_compras_min: numeroOuNull(comprasMin),
    publico_valor_min: numeroOuNull(valorMin),
    publico_aniversariantes_mes: aniversariantes,
  }
  const chavePublico = JSON.stringify(publico)

  // Prévia do público com debounce — só em campanha, e só quando o dialog
  // está aberto (evita chamar o banco a cada tecla nos filtros numéricos).
  useEffect(() => {
    if (!open || !campanha) return
    let cancelado = false
    setCarregandoPublico(true)
    const timer = setTimeout(async () => {
      const res = await previaPublicoCampanha(JSON.parse(chavePublico) as PublicoCampanha)
      if (cancelado) return
      setCarregandoPublico(false)
      setPublicoTotal("total" in res ? res.total : null)
    }, 400)
    return () => {
      cancelado = true
      clearTimeout(timer)
    }
  }, [open, campanha, chavePublico])

  const tetoDiarioEfetivo = numeroOuNull(tetoDiario) ?? TETO_DIARIO_CAMPANHA_PADRAO
  const diasEstimados = publicoTotal ? Math.ceil(publicoTotal / tetoDiarioEfetivo) : 0
  // Estimativa otimista: não conta D3 (quem recebeu outra mensagem no dia
  // fica pro seguinte) nem o horário de início no primeiro dia.
  const fimPrevisto = publicoTotal && dataInicio ? somarDias(dataInicio, diasEstimados - 1) : null

  function inserirPlaceholder(chave: string) {
    setMensagem((c) => `${c}${c && !c.endsWith(" ") ? " " : ""}${chave} `)
  }

  function alternarDia(dia: number) {
    setDiasSemana((dias) => (dias.includes(dia) ? dias.filter((d) => d !== dia) : [...dias, dia].sort()))
  }

  async function selecionarImagem(file: File | undefined | null) {
    if (!file) return
    if (!(IMAGEM_DISPARO_TIPOS as readonly string[]).includes(file.type)) {
      toast.error(`Formato não aceito. Use: ${IMAGEM_DISPARO_TIPOS.join(", ")}.`)
      return
    }
    if (file.size > IMAGEM_DISPARO_TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Imagem maior que ${IMAGEM_DISPARO_TAMANHO_MAX_MB}MB.`)
      return
    }
    setEnviandoImagem(true)
    try {
      const body = new FormData()
      body.append("arquivo", file, file.name)
      const resposta = await fetch(IMAGEM_DISPARO_API_ROUTE, { method: "POST", body })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao enviar imagem.")
        return
      }
      setImagemUrl(data.url as string)
    } catch {
      toast.error("Não foi possível enviar a imagem. Verifique sua internet.")
    } finally {
      setEnviandoImagem(false)
    }
  }

  async function salvar() {
    if (!campanha && diasSemana.length === 0) {
      toast.error("Selecione ao menos um dia da semana.")
      return
    }
    if (campanha && !dataInicio) {
      toast.error("Escolha a data da campanha.")
      return
    }
    setSalvando(true)
    const payload = {
      ...publico,
      nome,
      tipo,
      horario,
      dias_semana: diasSemana,
      dias_apos_compra: Number(diasAposCompra),
      mensagem_template: mensagem || null,
      imagem_url: imagemUrl,
      quantidade_max: quantidadeMax ? Number(quantidadeMax) : null,
      ativo,
      data_inicio: campanha ? dataInicio : null,
      data_fim: campanha && dataFim ? dataFim : null,
      teto_diario: campanha ? numeroOuNull(tetoDiario) : null,
    }
    const res = editando ? await atualizarTemplate(template!.id, payload) : await criarTemplate(payload)
    setSalvando(false)

    if (res?.error) {
      toast.error(res.error)
      return
    }
    toast.success(editando ? "Disparo atualizado" : "Disparo criado")
    await mutate("templates")
    onOpenChange(false)
  }

  const caracteres = contarCaracteres(mensagem)
  const excedeu = caracteres > LIMITE
  const quantidadeNum = quantidadeMax ? Number(quantidadeMax) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{editando ? "Editar disparo" : "Novo disparo"}</DialogTitle>
          <DialogDescription>
            Configure quando dispara e monte a mensagem, vendo em tempo real como ela chega na conversa do WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_340px]">
          {/* Formulário */}
          <div className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-nome">Nome do disparo</Label>
              <Input
                id="tpl-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={campanha ? "Ex.: Promoção Dia das Crianças" : "Ex.: Lembrete de recompra (5 dias)"}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-secondary p-1">
                {TIPOS.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    onClick={() => setTipo(t.valor)}
                    aria-pressed={tipo === t.valor}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                      tipo === t.valor
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{TIPOS.find((t) => t.valor === tipo)?.descricao}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-unidade">Unidade</Label>
              <Select value={unidadeId} onValueChange={(v) => setUnidadeId(v ?? "todas")}>
                <SelectTrigger id="tpl-unidade">
                  {/*
                    SelectValue sem children só mostra o label certo depois que o
                    SelectContent renderizou pelo menos uma vez (registro interno
                    do Radix) — antes disso cai pro value cru (o UUID aparecia na
                    tela ao abrir Editar). Computar o label aqui evita depender
                    desse timing.
                  */}
                  <SelectValue>
                    {unidadeId === "todas" ? "Todas as unidades" : (unidades.find((u) => u.id === unidadeId)?.nome ?? "Unidade removida")}
                  </SelectValue>
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

            {campanha ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-data-inicio">Data</Label>
                    <Input
                      id="tpl-data-inicio"
                      type="date"
                      min={editando ? undefined : hojeFortaleza()}
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-horario">Horário</Label>
                    <Input
                      id="tpl-horario"
                      type="time"
                      min={`${String(CAMPANHA_HORA_MIN).padStart(2, "0")}:00`}
                      max={`${CAMPANHA_HORA_MAX}:59`}
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tpl-data-fim">Até (opcional)</Label>
                    <Input
                      id="tpl-data-fim"
                      type="date"
                      min={dataInicio || undefined}
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </div>
                <p className="-mt-2 text-xs text-muted-foreground">
                  Começa no horário escolhido ({CAMPANHA_HORA_MIN}h às {CAMPANHA_HORA_MAX}h) e segue até 20h. Se o público
                  passar do limite do dia, continua nos dias seguintes até a data final (ou até todo mundo receber, se
                  ficar em branco).
                </p>

                <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Público</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                      {carregandoPublico ? <Loader2 className="size-3.5 animate-spin" /> : <Users className="size-3.5" />}
                      {publicoTotal === null ? "—" : `${publicoTotal} cliente(s)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tpl-dias-min">Sem vir há pelo menos (dias)</Label>
                      <Input id="tpl-dias-min" type="number" min={0} placeholder="Qualquer" value={diasSemCompraMin} onChange={(e) => setDiasSemCompraMin(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tpl-dias-max">Sem vir há no máximo (dias)</Label>
                      <Input id="tpl-dias-max" type="number" min={0} placeholder="Qualquer" value={diasSemCompraMax} onChange={(e) => setDiasSemCompraMax(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tpl-compras-min">Compras mínimas</Label>
                      <Input id="tpl-compras-min" type="number" min={0} placeholder="Qualquer" value={comprasMin} onChange={(e) => setComprasMin(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tpl-valor-min">Gasto mínimo (R$)</Label>
                      <Input id="tpl-valor-min" type="number" min={0} step="0.01" placeholder="Qualquer" value={valorMin} onChange={(e) => setValorMin(e.target.value)} />
                    </div>
                  </div>
                  <label className="flex items-center justify-between gap-3 text-sm text-foreground">
                    Só aniversariantes do mês
                    <Switch checked={aniversariantes} onCheckedChange={setAniversariantes} aria-label="Só aniversariantes do mês" />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Opt-out e clientes sem telefone já ficam de fora. Com filtro de dias, quem nunca comprou fica de fora.
                    Quem receber outra mensagem no mesmo dia fica pro dia seguinte.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="tpl-teto-diario">Envios por dia</Label>
                  <Input
                    id="tpl-teto-diario"
                    type="number"
                    min={1}
                    placeholder={`Padrão: ${TETO_DIARIO_CAMPANHA_PADRAO}`}
                    value={tetoDiario}
                    onChange={(e) => setTetoDiario(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {fimPrevisto
                      ? diasEstimados <= 1
                        ? `Previsão: todos recebem em ${ddmm(dataInicio)}.`
                        : `Previsão: ${diasEstimados} dias (${ddmm(dataInicio)} a ${ddmm(fimPrevisto)}).`
                      : "Limite de proteção contra bloqueio do número. Público maior que isso se espalha pelos dias seguintes."}
                    {fimPrevisto && dataFim && fimPrevisto > dataFim
                      ? " A data final chega antes disso: parte do público não vai receber."
                      : ""}
                  </p>
                </div>
              </>
            ) : (
            <>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-horario">Horário</Label>
                <Input id="tpl-horario" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tpl-dias-compra">Dias após a compra</Label>
                <Input
                  id="tpl-dias-compra"
                  type="number"
                  min={1}
                  value={diasAposCompra}
                  onChange={(e) => setDiasAposCompra(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Dias da semana</Label>
              <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-full border border-border bg-secondary p-1">
                {DIAS_SEMANA_OPCOES.map((d) => (
                  <button
                    key={d.valor}
                    type="button"
                    onClick={() => alternarDia(d.valor)}
                    aria-pressed={diasSemana.includes(d.valor)}
                    className={cn(
                      "rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      diasSemana.includes(d.valor)
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            </>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="tpl-quantidade">Teto de envios por rodada (opcional)</Label>
              <Input
                id="tpl-quantidade"
                type="number"
                min={1}
                placeholder="Sem teto próprio"
                value={quantidadeMax}
                onChange={(e) => setQuantidadeMax(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {quantidadeNum && quantidadeNum > TETO_SEGURANCA_GLOBAL
                  ? `Acima de ${TETO_SEGURANCA_GLOBAL} não tem efeito — esse é o teto de segurança global (todos os disparos somados por execução).`
                  : `Nunca ultrapassa o teto de segurança global de ${TETO_SEGURANCA_GLOBAL} envios por execução.`}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Imagem (opcional)</Label>
              {imagemUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagemUrl} alt="Imagem do disparo" className="size-14 rounded-md object-cover" />
                  <p className="flex-1 truncate text-xs text-muted-foreground">Imagem anexada</p>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setImagemUrl(null)}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
                  {enviandoImagem ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                  {enviandoImagem ? "Enviando…" : "Escolher imagem (jpeg, png, webp — até 5MB)"}
                  <input
                    type="file"
                    accept={IMAGEM_DISPARO_TIPOS.join(",")}
                    className="sr-only"
                    onChange={(e) => selecionarImagem(e.target.files?.[0])}
                    disabled={enviandoImagem}
                  />
                </label>
              )}
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
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
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
                Formatação WhatsApp: <code>*negrito*</code>, <code>_itálico_</code>, <code>~tachado~</code>. Mensagem, imagem, ou os dois — não pode ficar vazio.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Disparo ativo</p>
                <p className="text-xs text-muted-foreground">
                  {campanha
                    ? "Passa a disparar de verdade na data e horário configurados"
                    : "Passa a disparar de verdade nos dias/horário configurados"}
                </p>
              </div>
              <Switch checked={ativo} onCheckedChange={setAtivo} aria-label="Disparo ativo" />
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-border bg-secondary/30 p-6 lg:border-l lg:border-t-0">
            <WhatsAppPreview corpo={mensagem} imagemUrl={imagemUrl} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando || excedeu}>
            {salvando && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {editando ? "Salvar alterações" : "Criar disparo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
