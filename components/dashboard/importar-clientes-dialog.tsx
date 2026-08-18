"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUnidadesRaw } from "@/hooks/use-raw-data"
import { IMPORT_API_ROUTE, IMPORT_EXTENSOES, IMPORT_TAMANHO_MAX_MB } from "@/config/dashboard"

/**
 * Upload da base de clientes (Excel/CSV) — proxy same-origin pra Edge
 * Function importar-clientes (Supabase), já que não existe API do cliente
 * pra puxar esse dado; unidade + cliente sempre importam manualmente.
 */
export function ImportarClientesDialog() {
  const { data: unidades } = useUnidadesRaw()
  const { mutate } = useSWRConfig()

  const [open, setOpen] = useState(false)
  const [unidade, setUnidade] = useState<string>("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)

  function fechar(v: boolean) {
    if (!v) {
      setUnidade("")
      setArquivo(null)
    }
    setOpen(v)
  }

  async function importar() {
    if (!unidade) {
      toast.error("Selecione a unidade.")
      return
    }
    if (!arquivo) {
      toast.error("Selecione um arquivo.")
      return
    }

    setEnviando(true)
    try {
      const body = new FormData()
      body.append("unidade", unidade)
      body.append("arquivo", arquivo, arquivo.name)
      const resposta = await fetch(IMPORT_API_ROUTE, { method: "POST", body })
      const data = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        toast.error(data.error ?? "Falha ao importar.")
        return
      }
      toast.success(data.message ?? "Importação concluída.")
      await mutate("importacoes")
      await mutate("clientes")
      fechar(false)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Importar clientes
      </Button>

      <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar base de clientes</DialogTitle>
          <DialogDescription>
            Sem integração de API pra puxar a base — envie a planilha exportada do sistema da unidade
            ({IMPORT_EXTENSOES.join(", ")}, até {IMPORT_TAMANHO_MAX_MB}MB).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="import-unidade">Unidade</Label>
            <Select value={unidade} onValueChange={(v) => setUnidade(v ?? "")}>
              <SelectTrigger id="import-unidade">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {(unidades ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.nome}>
                    {u.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="import-arquivo">Arquivo</Label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
              <Upload className="size-4" />
              {arquivo ? arquivo.name : `Escolher arquivo (${IMPORT_EXTENSOES.join(", ")})`}
              <input
                id="import-arquivo"
                type="file"
                accept={IMPORT_EXTENSOES.join(",")}
                className="sr-only"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                disabled={enviando}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => fechar(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={importar} disabled={enviando}>
            {enviando && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Importar
          </Button>
        </div>
      </DialogContent>
      </Dialog>
    </>
  )
}
