"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { SectionCard } from "@/components/dashboard/section-card"
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
import {
  ITENS_POR_PAGINA_OPCOES,
  PERIODOS_PADRAO_SELECIONAVEIS,
  UNIDADES,
  type PreferenciasPainel,
} from "@/config/dashboard"

/**
 * Preferências alimentam o estado inicial do dashboard (useDashboardFilters,
 * paginação do histórico) — mudar aqui muda com o que o painel abre da
 * próxima vez, sem afetar a sessão de filtros já em uso.
 */
export function PreferenciasCard({ preferencias }: { preferencias: PreferenciasPainel }) {
  const [valores, setValores] = useState(preferencias)
  const [salvando, setSalvando] = useState(false)

  const alterado =
    valores.unidadePadrao !== preferencias.unidadePadrao ||
    valores.periodoPadrao !== preferencias.periodoPadrao ||
    valores.incluirGrupoTestePadrao !== preferencias.incluirGrupoTestePadrao ||
    valores.itensPorPagina !== preferencias.itensPorPagina

  async function handleSalvar() {
    setSalvando(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ data: { preferencias: valores } })
      if (error) {
        toast.error("Não foi possível salvar. Tente novamente.")
        return
      }
      toast.success("Preferências salvas.")
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  return (
    <SectionCard
      title="Preferências"
      description="Como o painel abre por padrão"
      action={
        <Button type="button" size="sm" className="gap-1.5" disabled={!alterado || salvando} onClick={handleSalvar}>
          {salvando ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Salvar
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-unidade">Unidade padrão</Label>
          <Select
            value={valores.unidadePadrao}
            onValueChange={(v) => setValores((s) => ({ ...s, unidadePadrao: v as typeof s.unidadePadrao }))}
          >
            <SelectTrigger id="pref-unidade" size="sm" className="w-full">
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-periodo">Período padrão</Label>
          <Select
            value={valores.periodoPadrao}
            onValueChange={(v) => setValores((s) => ({ ...s, periodoPadrao: v as typeof s.periodoPadrao }))}
          >
            <SelectTrigger id="pref-periodo" size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS_PADRAO_SELECIONAVEIS.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-itens-pagina">Itens por página (histórico)</Label>
          <Select
            value={String(valores.itensPorPagina)}
            onValueChange={(v) => setValores((s) => ({ ...s, itensPorPagina: Number(v) }))}
          >
            <SelectTrigger id="pref-itens-pagina" size="sm" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITENS_POR_PAGINA_OPCOES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pref-grupo-teste">Grupo de teste</Label>
          <div className="flex h-7 items-center gap-2.5">
            <Switch
              id="pref-grupo-teste"
              size="sm"
              checked={valores.incluirGrupoTestePadrao}
              onCheckedChange={(v) => setValores((s) => ({ ...s, incluirGrupoTestePadrao: v }))}
            />
            <span className="text-sm text-muted-foreground">Incluir por padrão</span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
