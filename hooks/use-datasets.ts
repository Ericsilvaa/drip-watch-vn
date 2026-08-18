'use client'

/**
 * Junta os datasets brutos num único ponto de consumo para os hooks de domínio.
 * Expõe envios já enriquecidos (com nome do cliente/unidade) e o estado agregado
 * de carregamento/erro — assim cada hook de domínio não repete essa costura.
 */
import { useMemo } from 'react'
import { useDashboardDataRaw } from '@/hooks/use-raw-data'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { enrichEnvios, resolveUnidadeId } from '@/lib/data/selectors'

export function useDatasets() {
  const { data, isLoading, error } = useDashboardDataRaw()
  const { unidade } = useDashboardFilters()

  const unidades = data?.unidades ?? []
  const clientes = data?.clientes ?? []
  const importacoes = data?.importacoes ?? []

  const enviosDetalhados = useMemo(
    () => enrichEnvios(data?.envios ?? [], clientes, unidades),
    [data?.envios, clientes, unidades],
  )

  const unidadeId = useMemo(
    () => resolveUnidadeId(unidades, unidade),
    [unidades, unidade],
  )

  return {
    unidades,
    clientes,
    importacoes,
    enviosDetalhados,
    unidadeId,
    isLoading,
    error: (error as Error | undefined) ?? null,
  }
}

/** Sequência dos últimos N dias como chaves yyyy-mm-dd (antigo -> recente). */
export function ultimosNDias(n: number): string[] {
  const dias: string[] = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(d.getDate() - i)
    dias.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`,
    )
  }
  return dias
}
