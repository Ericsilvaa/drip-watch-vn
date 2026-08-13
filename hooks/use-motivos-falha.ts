'use client'

import { useMemo } from 'react'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets } from '@/hooks/use-datasets'
import { filtrarEnvios } from '@/lib/data/selectors'

export interface MotivoFalha {
  motivo: string
  contagem: number
  percentual: number
}

/** Ranking dos valores de detalhe_erro mais frequentes (status = erro). */
export function useMotivosFalha() {
  const { inicioPeriodo, fimPeriodo, incluirGrupoTeste } = useDashboardFilters()
  const { enviosDetalhados, unidadeId, isLoading, error } = useDatasets()

  const motivos = useMemo<MotivoFalha[]>(() => {
    const erros = filtrarEnvios(enviosDetalhados, {
      inicio: inicioPeriodo,
      fim: fimPeriodo,
      unidadeId,
      incluirGrupoTeste,
    }).filter((e) => e.status === 'erro')

    const mapa = new Map<string, number>()
    for (const e of erros) {
      const motivo = (e.detalhe_erro ?? 'Erro não especificado').trim()
      mapa.set(motivo, (mapa.get(motivo) ?? 0) + 1)
    }
    const total = erros.length
    return Array.from(mapa.entries())
      .map(([motivo, contagem]) => ({
        motivo,
        contagem,
        percentual: total > 0 ? contagem / total : 0,
      }))
      .sort((a, b) => b.contagem - a.contagem)
  }, [enviosDetalhados, unidadeId, inicioPeriodo, fimPeriodo, incluirGrupoTeste])

  return { motivos, isLoading, error }
}
