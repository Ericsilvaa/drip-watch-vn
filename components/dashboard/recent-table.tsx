"use client"

import { useState } from "react"
import type { StatusEnvio } from "@/config/dashboard"
import { useEnviosRecentes } from "@/hooks/use-envios-recentes"
import { fmtDataHora } from "@/lib/format"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { AsyncBoundary } from "@/components/dashboard/state"
import { ExportCsvButton } from "@/components/dashboard/export-csv-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const filtros: { key: StatusEnvio | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "enviado", label: "Entregues" },
  { key: "erro", label: "Falhas" },
  { key: "opt_out_bloqueado", label: "Opt-out" },
]

const LIMITE = 8

export function RecentTable() {
  const [filtro, setFiltro] = useState<StatusEnvio | "todos">("todos")
  const { envios, isLoading, error } = useEnviosRecentes(filtro)
  const visiveis = envios.slice(0, LIMITE)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-0.5">
          {filtros.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFiltro(f.key)}
              aria-pressed={filtro === f.key}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                filtro === f.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ExportCsvButton
          secao="envios_recentes"
          headers={["cliente", "unidade", "status", "detalhe_erro", "enviado_em"]}
          rows={visiveis.map((e) => [e.cliente_nome, e.unidade_nome, e.status, e.detalhe_erro ?? "", fmtDataHora(e.enviado_em)])}
        />
      </div>

      <AsyncBoundary
        isLoading={isLoading}
        error={error}
        isEmpty={envios.length === 0}
        emptyMessage="Nenhum envio para este filtro no período."
        loadingClassName="h-[300px]"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Enviado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{e.cliente_nome}</span>
                      {e.cliente_grupo_teste ? (
                        <span className="rounded bg-highlight-bg px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                          teste
                        </span>
                      ) : null}
                    </div>
                    {e.status === "erro" && e.detalhe_erro ? (
                      <p className="mt-0.5 text-xs text-status-error">{e.detalhe_erro}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.unidade_nome}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {fmtDataHora(e.enviado_em)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AsyncBoundary>
    </div>
  )
}
