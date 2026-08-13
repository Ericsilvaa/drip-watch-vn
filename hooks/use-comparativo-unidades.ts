'use client'

import { useMemo } from 'react'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets } from '@/hooks/use-datasets'
import { contarStatus, filtrarEnvios } from '@/lib/data/selectors'

export interface UnidadeComparativo {
  id: string
  nome: string
  slug: string
  enviado: number
  opt_out: number
  taxaSucesso: number
  /** true quando o toggle de unidade do cabeçalho seleciona outra unidade */
  esmaecida: boolean
}

/**
 * Comparativo Cambeba x Guararapes. Sempre considera as duas unidades (ignora o
 * filtro de unidade para o conteúdo), mas marca `esmaecida` na que não está
 * selecionada — a comparação só faz sentido com ambas visíveis.
 */
export function useComparativoUnidades() {
  const { inicioPeriodo, fimPeriodo, incluirGrupoTeste, unidade } =
    useDashboardFilters()
  const { enviosDetalhados, unidades, isLoading, error } = useDatasets()

  const comparativo = useMemo<UnidadeComparativo[]>(() => {
    return unidades.map((u) => {
      const doPeriodo = filtrarEnvios(enviosDetalhados, {
        inicio: inicioPeriodo,
        fim: fimPeriodo,
        unidadeId: u.id,
        incluirGrupoTeste,
      })
      const c = contarStatus(doPeriodo)
      const slug = u.nome.toLowerCase().includes('cambeba')
        ? 'cambeba'
        : 'guararapes'
      return {
        id: u.id,
        nome: u.nome,
        slug,
        enviado: c.enviado,
        opt_out: c.opt_out,
        taxaSucesso: c.taxaSucesso,
        esmaecida: unidade !== 'todas' && unidade !== slug,
      }
    })
  }, [enviosDetalhados, unidades, inicioPeriodo, fimPeriodo, incluirGrupoTeste, unidade])

  return { comparativo, isLoading, error }
}
