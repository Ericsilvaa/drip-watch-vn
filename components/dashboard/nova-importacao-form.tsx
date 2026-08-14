"use client"

import { useRef, useState, type DragEvent } from "react"
import { mutate } from "swr"
import { FileUp, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { IMPORT_API_ROUTE, IMPORT_EXTENSOES, IMPORT_TAMANHO_MAX_MB, UNIDADES } from "@/config/dashboard"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const UNIDADES_IMPORTAVEIS = UNIDADES.filter((u) => u.slug !== "todas")

function extensaoValida(nome: string): boolean {
  const lower = nome.toLowerCase()
  return IMPORT_EXTENSOES.some((ext) => lower.endsWith(ext))
}

/**
 * Painel "Nova importação": aciona o workflow n8n já existente
 * (01-captura-importacao-clientes.json) via /api/importar-clientes — não
 * escreve no Supabase. Ver app/api/importar-clientes/route.ts.
 */
export function NovaImportacaoForm() {
  const [unidade, setUnidade] = useState<string>(UNIDADES_IMPORTAVEIS[0]?.nome ?? "")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
    setEnviando(true)
    try {
      const body = new FormData()
      body.append("unidade", unidade)
      body.append("arquivo", arquivo, arquivo.name)

      const resposta = await fetch(IMPORT_API_ROUTE, { method: "POST", body })
      const data = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao enviar a importação.")
        return
      }

      toast.success(data.message ?? "Recebido! O processamento ocorre em segundo plano.")
      setArquivo(null)
      if (inputRef.current) inputRef.current.value = ""

      // Best-effort: revalida importacoes/clientes daqui a alguns segundos
      // pra dar tempo do workflow terminar. Não há garantia de timing —
      // é só pra poupar o usuário de dar F5 manualmente.
      setTimeout(() => {
        mutate("importacoes")
        mutate("clientes")
      }, 5000)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet e tente de novo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-highlight-bg bg-highlight-bg/40 p-3">
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
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-primary/40 bg-card px-3 py-2 text-left transition-colors",
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
            onChange={(e) => selecionarArquivo(e.target.files?.[0])}
          />
        </div>

        <Button
          type="button"
          size="sm"
          disabled={!arquivo || !unidade || enviando}
          onClick={handleSubmit}
          className="gap-1.5"
        >
          {enviando ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Enviar
        </Button>
      </div>
    </div>
  )
}
