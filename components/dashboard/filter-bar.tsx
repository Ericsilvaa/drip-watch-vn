"use client"

import { PERIODOS, UNIDADES } from "@/config/dashboard"
import { useDashboardFilters } from "@/hooks/use-dashboard-filters"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function FilterBar() {
  const {
    periodo,
    setPeriodo,
    customRange,
    setCustomRange,
    unidade,
    setUnidade,
    incluirGrupoTeste,
    setIncluirGrupoTeste,
  } = useDashboardFilters()

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {/* Período */}
        <div
          role="group"
          aria-label="Período"
          className="inline-flex items-center rounded-full bg-muted p-0.5"
        >
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodo(p.key)}
              aria-pressed={periodo === p.key}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                periodo === p.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodo === "custom" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label="Data inicial"
              value={customRange.from}
              max={customRange.to}
              onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
              className="h-9 w-auto"
            />
            <span className="text-sm text-muted-foreground">até</span>
            <Input
              type="date"
              aria-label="Data final"
              value={customRange.to}
              min={customRange.from}
              onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
              className="h-9 w-auto"
            />
          </div>
        ) : null}

        {/* Unidade */}
        <Select value={unidade} onValueChange={(v) => setUnidade(v as typeof unidade)}>
          <SelectTrigger className="h-9 w-[200px]" aria-label="Unidade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIDADES.map((u) => (
              <SelectItem key={u.slug} value={u.slug}>
                {u.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grupo de teste */}
      <div className="flex items-center gap-2.5">
        <Switch
          id="grupo-teste"
          checked={incluirGrupoTeste}
          onCheckedChange={setIncluirGrupoTeste}
        />
        <Label htmlFor="grupo-teste" className="cursor-pointer text-sm text-muted-foreground">
          Incluir grupo de teste
        </Label>
      </div>
    </div>
  )
}
