"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { csvFilename, downloadCsv, toCsv } from "@/lib/csv"

export function ExportCsvButton({
  secao,
  headers,
  rows,
  disabled,
}: {
  /** Usado no nome do arquivo: `<secao>_AAAA-MM-DD.csv`. */
  secao: string
  headers: string[]
  rows: unknown[][]
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 bg-highlight-bg text-primary hover:bg-highlight-bg/70"
      disabled={disabled || rows.length === 0}
      onClick={() => {
        const filename = csvFilename(secao)
        downloadCsv(filename, toCsv(headers, rows))
        toast.success(`${filename} exportado`)
      }}
    >
      <Download className="size-3.5" />
      Exportar CSV
    </Button>
  )
}
