'use client'

import { useMemo } from 'react'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets, ultimosNDias } from '@/hooks/use-datasets'
import { chaveDia } from '@/lib/data/selectors'

export interface DiaDisparos {
  dia: string // yyyy-mm-dd
  enviado: number
  erro: number
  opt_out_bloqueado: number
  total: number
}

/** Série de barras empilhadas dos últimos 7 dias, respeitando unidade + grupo de teste. */
export function useEnviosPorDia() {
  const { incluirGrupoTeste } = useDashboardFilters()
  const { enviosDetalhados, unidadeId, isLoading, error } = useDatasets()

  const dados = useMemo<DiaDisparos[]>(() => {
    const dias = ultimosNDias(7)
    const base: Record<string, DiaDisparos> = {}
    for (const dia of dias) {
      base[dia] = { dia, enviado: 0, erro: 0, opt_out_bloqueado: 0, total: 0 }
    }
    for (const e of enviosDetalhados) {
      if (unidadeId && e.unidade_id !== unidadeId) continue
      if (!incluirGrupoTeste && e.cliente_grupo_teste) continue
      const dia = chaveDia(e.enviado_em)
      if (!base[dia]) continue
      base[dia][e.status] += 1
      base[dia].total += 1
    }
    return dias.map((d) => base[d])
  }, [enviosDetalhados, unidadeId, incluirGrupoTeste])

  return { dados, isLoading, error }
}
