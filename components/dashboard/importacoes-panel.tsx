"use client"

import { FileSpreadsheet } from "lucide-react"
import { useDatasets } from "@/hooks/use-datasets"
import { fmtDataHora, fmtNumero } from "@/lib/format"
import { AsyncBoundary } from "@/components/dashboard/state"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { NovaImportacaoForm } from "@/components/dashboard/nova-importacao-form"

export function ImportacoesPanel() {
  const { importacoes, unidades, isLoading, error } = useDatasets()
  const unidadeNome = (id: string) => unidades.find((u) => u.id === id)?.nome ?? "—"
  const recentes = [...importacoes]
    .sort((a, b) => new Date(b.importado_em).getTime() - new Date(a.importado_em).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col">
      <NovaImportacaoForm />

      <div className="mb-2 flex justify-end">
        <ExportCsvButton
          secao="importacoes"
          headers={["arquivo", "unidade", "linhas_lidas", "linhas_validas", "linhas_rejeitadas", "data"]}
          rows={importacoes.map((imp) => [
            imp.arquivo,
            unidadeNome(imp.unidade_id),
            imp.linhas_lidas,
            imp.linhas_validas,
            imp.linhas_rejeitadas,
            fmtDataHora(imp.importado_em),
          ])}
        />
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={recentes.length === 0}
        emptyMessage="Nenhuma importação registrada."
        loadingClassName="h-[220px]"
      >
        <ul className="flex flex-col divide-y divide-border">
        {recentes.map((imp) => {
          const rejeitou = imp.linhas_rejeitadas > 0
          return (
            <li key={imp.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FileSpreadsheet className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{imp.arquivo}</p>
                <p className="text-xs text-muted-foreground">
                  {unidadeNome(imp.unidade_id)} · {fmtDataHora(imp.importado_em)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-status-success">
                  {fmtNumero(imp.linhas_validas)} válidas
                </p>
                <p className={rejeitou ? "text-xs text-status-error" : "text-xs text-muted-foreground"}>
                  {fmtNumero(imp.linhas_rejeitadas)} rejeitadas
                </p>
              </div>
            </li>
          )
        })}
        </ul>
      </AsyncBoundary>
    </div>
  )
}
