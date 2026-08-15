"use client"

import { useMemo, useState } from "react"
import { Search, Users } from "lucide-react"
import { useDashboardFilters } from "@/hooks/use-dashboard-filters"
import { useHistoricoDisparos } from "@/hooks/use-historico-disparos"
import { fmtDataHora, fmtNumero } from "@/lib/format"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AsyncBoundary } from "@/components/dashboard/state"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function HistoricoTable() {
  const [busca, setBusca] = useState("")
  const [pagina, setPagina] = useState(1)
  const { itensPorPagina } = useDashboardFilters()
  const { linhas, isLoading, error } = useHistoricoDisparos(busca)

  const totalPaginas = Math.max(1, Math.ceil(linhas.length / itensPorPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = useMemo(
    () => linhas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina),
    [linhas, paginaAtual, itensPorPagina],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por cliente..."
            className="pl-9"
            aria-label="Buscar por cliente"
          />
        </div>
        <ExportCsvButton
          secao="historico_disparos"
          headers={["cliente", "unidade", "status", "detalhe_erro", "enviado_em", "total_disparos_cliente", "multi_unidade"]}
          rows={linhas.map((l) => [
            l.cliente_nome,
            l.unidade_nome,
            l.status,
            l.detalhe_erro ?? "",
            fmtDataHora(l.enviado_em),
            l.total_disparos_cliente,
            l.multi_unidade ? "sim" : "não",
          ])}
        />
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={linhas.length === 0}
        emptyMessage={busca ? "Nenhum cliente encontrado." : "Sem histórico de disparos."}
        loadingClassName="h-[360px]"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Disparos do cliente</TableHead>
                <TableHead className="text-right">Enviado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{l.cliente_nome}</span>
                      {l.multi_unidade ? (
                        <span className="inline-flex items-center gap-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                          <Users className="size-3" />
                          multi-unidade
                        </span>
                      ) : null}
                      {l.cliente_grupo_teste ? (
                        <span className="rounded bg-highlight-bg px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                          teste
                        </span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.unidade_nome}</TableCell>
                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">
                    {fmtNumero(l.total_disparos_cliente)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmtDataHora(l.enviado_em)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {fmtNumero(linhas.length)} disparo(s) · página {paginaAtual} de {totalPaginas}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual >= totalPaginas}
            >
              Próxima
            </Button>
          </div>
        </div>
      </AsyncBoundary>
    </div>
  )
}
