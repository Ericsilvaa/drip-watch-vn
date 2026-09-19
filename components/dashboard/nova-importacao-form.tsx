"use client"

import { useRef, useState, type DragEvent } from "react"
import { mutate } from "swr"
import { FileUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { IMPORT_API_ROUTE, IMPORT_EXTENSOES, IMPORT_TAMANHO_MAX_MB, UNIDADES } from "@/config/dashboard"
import type { Importacao } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const UNIDADES_IMPORTAVEIS = UNIDADES.filter((u) => u.slug !== "todas")

// Intervalo e tentativas de espera pelo processamento assíncrono da Edge
// Function (ver comentário em handleSubmit) — ~20s no total.
const POLL_INTERVALO_MS = 2500
const POLL_TENTATIVAS = 8

function extensaoValida(nome: string): boolean {
  const lower = nome.toLowerCase()
  return IMPORT_EXTENSOES.some((ext) => lower.endsWith(ext))
}

/** POST com FormData via XHR — só o XHR expõe progresso real de upload (fetch não expõe). */
function enviarComProgresso(
  url: string,
  body: FormData,
  onProgress: (percentual: number) => void,
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = {}
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data })
    }
    xhr.onerror = () => reject(new Error("network"))
    xhr.send(body)
  })
}

/**
 * Painel "Nova importação": envia a planilha para /api/importar-clientes,
 * que faz proxy same-origin para a Edge Function `importar-clientes`
 * (Supabase). Não escreve no Supabase daqui — validação, normalização de
 * telefone e gravação em clientes/importacoes acontecem na Edge Function.
 * Ver app/api/importar-clientes/route.ts.
 */
export function NovaImportacaoForm({
  onProcessingChange,
}: {
  /** Avisa o painel-pai (lista de importações) quando um envio está em upload/processamento. */
  onProcessingChange?: (info: { ativo: boolean; arquivo?: string }) => void
} = {}) {
  const [unidade, setUnidade] = useState<string>(UNIDADES_IMPORTAVEIS[0]?.nome ?? "")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [processando, setProcessando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function aguardarProcessamento(nomeArquivo: string, desde: number): Promise<boolean> {
    for (let tentativa = 0; tentativa < POLL_TENTATIVAS; tentativa++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVALO_MS))
      const atual = await mutate<Importacao[]>("importacoes")
      const chegou = atual?.some(
        (imp) => imp.arquivo === nomeArquivo && new Date(imp.importado_em).getTime() >= desde,
      )
      if (chegou) {
        mutate("clientes")
        return true
      }
    }
    return false
  }

  function selecionarArquivo(file: File | undefined | null) {
    if (!file) return
    if (!extensaoValida(file.name)) {
      toast.error(`Formato não aceito. Use: ${IMPORT_EXTENSOES.join(", ")}.`)
      return
    }
    if (file.size > IMPORT_TAMANHO_MAX_MB * 1024 * 1024) {
      toast.error(`Arquivo maior que ${IMPORT_TAMANHO_MAX_MB}MB.`)
      return
    }
    setArquivo(file)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    selecionarArquivo(e.dataTransfer.files?.[0])
  }

  async function handleSubmit() {
    if (!arquivo || !unidade) return
    const nomeArquivo = arquivo.name
    setEnviando(true)
    setProgresso(0)
    try {
      const body = new FormData()
      body.append("unidade", unidade)
      body.append("arquivo", arquivo, nomeArquivo)

      const resposta = await enviarComProgresso(IMPORT_API_ROUTE, body, setProgresso)

      if (!resposta.ok) {
        toast.error((resposta.data.error as string | undefined) ?? "Falha ao enviar a importação.")
        return
      }

      toast.success((resposta.data.message as string | undefined) ?? "Recebido! Processando a planilha…")
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ""
      setEnviando(false)

      // A validação/normalização/gravação roda de forma assíncrona na Edge
      // Function — o upload em si só confirma o recebimento. Em vez de
      // adivinhar um tempo fixo, ficamos revalidando "importacoes" até a
      // linha desta planilha aparecer (ou desistimos após ~20s e avisamos
      // o usuário a checar depois).
      setProcessando(true)
      onProcessingChange?.({ ativo: true, arquivo: nomeArquivo })
      try {
        const desde = Date.now()
        const concluiu = await aguardarProcessamento(nomeArquivo, desde)
        if (concluiu) {
          toast.success(`Importação de "${nomeArquivo}" concluída.`)
        } else {
          toast.message("Ainda processando em segundo plano. Se não aparecer na lista em instantes, atualize a página.")
        }
      } finally {
        setProcessando(false)
        onProcessingChange?.({ ativo: false })
      }
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet e tente de novo.")
    } finally {
      setEnviando(false)
      setProgresso(0)
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-highlight-bg bg-highlight-bg/40 p-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">Nova importação</p>
        <p className="text-xs text-muted-foreground text-pretty">
          Sobe a planilha do PDV pro workflow de importação — validação, normalização de telefone e
          gravação em clientes continuam lá, não aqui.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1 sm:w-48">
          <Label htmlFor="importar-unidade" className="text-xs text-muted-foreground">
            Unidade
          </Label>
          <Select value={unidade} onValueChange={(value) => value && setUnidade(value)}>
            <SelectTrigger id="importar-unidade" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES_IMPORTAVEIS.map((u) => (
                <SelectItem key={u.slug} value={u.nome}>
                  {u.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div
          role="button"
          tabIndex={enviando || processando ? -1 : 0}
          aria-disabled={enviando || processando}
          onClick={() => !(enviando || processando) && inputRef.current?.click()}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            !(enviando || processando) &&
            inputRef.current?.click()
          }
          onDragOver={(e) => {
            e.preventDefault()
            if (!(enviando || processando)) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => !(enviando || processando) && handleDrop(e)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-dashed border-primary/40 bg-card px-3 py-2 text-left transition-colors",
            enviando || processando ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            dragOver && "border-primary bg-highlight-bg",
          )}
        >
          <FileUp className="size-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {arquivo ? (
              <span className="font-medium text-primary">{arquivo.name}</span>
            ) : (
              <>
                <span className="font-medium text-foreground">Arraste o Excel aqui</span> ou clique
                para selecionar ({IMPORT_EXTENSOES.join(", ")})
              </>
            )}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={IMPORT_EXTENSOES.join(",")}
            className="sr-only"
            disabled={enviando || processando}
            onChange={(e) => selecionarArquivo(e.target.files?.[0])}
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!arquivo || !unidade || enviando || processando}
          onClick={handleSubmit}
          className="gap-1.5 rounded-full"
        >
          {enviando ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Enviar
        </Button>
      </div>

      {enviando && (
        <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Enviando planilha…</span>
            <span className="tabular-nums font-medium text-foreground">{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-1.5" />
        </div>
      )}

      {processando && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          <span>Processando a planilha — validando e normalizando os contatos, pode levar alguns instantes…</span>
        </div>
      )}
    </div>
  )
}
