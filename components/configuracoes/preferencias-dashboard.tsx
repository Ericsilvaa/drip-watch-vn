"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PERIODOS, PERIODO_PADRAO, type PeriodoKey } from "@/config/dashboard"

const CHAVE = "lavateria:preferencias"

type Prefs = {
  periodoPadrao: PeriodoKey
  mostrarGrupoTeste: boolean
  densidade: "confortavel" | "compacta"
}

const PADRAO: Prefs = {
  periodoPadrao: PERIODO_PADRAO,
  mostrarGrupoTeste: false,
  densidade: "confortavel",
}

/**
 * Preferências de exibição do painel. Persistidas em localStorage por serem
 * escolhas pessoais de visualização (não dados de negócio). O período padrão
 * é lido pelo provider de filtros na próxima navegação.
 */
export function PreferenciasDashboard() {
  const [prefs, setPrefs] = useState<Prefs>(PADRAO)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE)
      if (salvo) setPrefs({ ...PADRAO, ...JSON.parse(salvo) })
    } catch {
      /* ignora */
    }
    setCarregado(true)
  }, [])

  function salvar() {
    localStorage.setItem(CHAVE, JSON.stringify(prefs))
    toast.success("Preferências salvas")
  }

  if (!carregado) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="pref-periodo">Período padrão ao abrir o painel</Label>
        <Select
          value={prefs.periodoPadrao}
          onValueChange={(v) => setPrefs((p) => ({ ...p, periodoPadrao: v as PeriodoKey }))}
        >
          <SelectTrigger id="pref-periodo" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.filter((p) => p.key !== "custom").map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Mostrar grupo de teste por padrão</p>
          <p className="text-xs text-muted-foreground">Inclui clientes marcados como teste nas métricas</p>
        </div>
        <Switch
          checked={prefs.mostrarGrupoTeste}
          onCheckedChange={(v) => setPrefs((p) => ({ ...p, mostrarGrupoTeste: v }))}
          aria-label="Mostrar grupo de teste"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pref-densidade">Densidade das tabelas</Label>
        <Select
          value={prefs.densidade}
          onValueChange={(v) => setPrefs((p) => ({ ...p, densidade: v as Prefs["densidade"] }))}
        >
          <SelectTrigger id="pref-densidade" className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confortavel">Confortável</SelectItem>
            <SelectItem value="compacta">Compacta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Button onClick={salvar}>Salvar preferências</Button>
      </div>
    </div>
  )
}
