'use client'

import { useMemo } from 'react'
import type { StatusEnvio } from '@/config/dashboard'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets } from '@/hooks/use-datasets'
import { filtrarEnvios } from '@/lib/data/selectors'
import type { EnvioDetalhado } from '@/lib/types'

/**
 * Envios recentes: respeita período/unidade/grupo de teste do cabeçalho, com
 * filtro adicional por status. Já ordenados do mais recente para o mais antigo.
 */
export function useEnviosRecentes(filtroStatus: StatusEnvio | 'todos') {
  const { inicioPeriodo, fimPeriodo, incluirGrupoTeste } = useDashboardFilters()
  const { enviosDetalhados, unidadeId, isLoading, error } = useDatasets()

  const envios = useMemo<EnvioDetalhado[]>(() => {
    let lista = filtrarEnvios(enviosDetalhados, {
      inicio: inicioPeriodo,
      fim: fimPeriodo,
      unidadeId,
      incluirGrupoTeste,
    })
    if (filtroStatus !== 'todos') {
      lista = lista.filter((e) => e.status === filtroStatus)
    }
    return lista.sort(
      (a, b) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime(),
    )
  }, [enviosDetalhados, unidadeId, inicioPeriodo, fimPeriodo, incluirGrupoTeste, filtroStatus])

  return { envios, isLoading, error }
}
