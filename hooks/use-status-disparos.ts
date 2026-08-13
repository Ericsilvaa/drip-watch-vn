'use client'

import { useMemo } from 'react'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets } from '@/hooks/use-datasets'
import { contarStatus, filtrarEnvios } from '@/lib/data/selectors'

export interface FatiaStatus {
  chave: 'enviado' | 'erro'
  label: string
  valor: number
  percentual: number
  cor: string
}

/** Donut Entregues x Falhas (opt-out não entra na rosca de entrega). */
export function useStatusDisparos() {
  const { inicioPeriodo, fimPeriodo, incluirGrupoTeste } = useDashboardFilters()
  const { enviosDetalhados, unidadeId, isLoading, error } = useDatasets()

  const { fatias, total } = useMemo(() => {
    const noPeriodo = filtrarEnvios(enviosDetalhados, {
      inicio: inicioPeriodo,
      fim: fimPeriodo,
      unidadeId,
      incluirGrupoTeste,
    })
    const c = contarStatus(noPeriodo)
    const totalEntrega = c.enviado + c.erro
    const fatias: FatiaStatus[] = [
      {
        chave: 'enviado',
        label: 'Entregues',
        valor: c.enviado,
        percentual: totalEntrega > 0 ? c.enviado / totalEntrega : 0,
        cor: 'var(--color-status-success)',
      },
      {
        chave: 'erro',
        label: 'Falhas',
        valor: c.erro,
        percentual: totalEntrega > 0 ? c.erro / totalEntrega : 0,
        cor: 'var(--color-status-error)',
      },
    ]
    return { fatias, total: totalEntrega }
  }, [enviosDetalhados, unidadeId, inicioPeriodo, fimPeriodo, incluirGrupoTeste])

  return { fatias, total, isLoading, error }
}
