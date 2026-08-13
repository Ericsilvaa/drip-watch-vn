'use client'

import { useMemo } from 'react'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets } from '@/hooks/use-datasets'
import type { LinhaHistorico } from '@/lib/types'

/**
 * Histórico completo de disparos (NÃO limitado ao período do cabeçalho).
 * Duas informações a mais que "Envios recentes":
 *  - total de disparos do cliente em TODAS as unidades (mesmo com filtro de
 *    unidade ativo — o valor é justamente o total real, não o recortado);
 *  - marcação "multi-unidade" quando o mesmo cliente (nome/CPF) está cadastrado
 *    em Cambeba e Guararapes.
 * Respeita o filtro de unidade e grupo de teste apenas para QUAIS linhas exibir.
 */
export function useHistoricoDisparos(busca: string) {
  const { incluirGrupoTeste } = useDashboardFilters()
  const { enviosDetalhados, clientes, unidadeId, isLoading, error } =
    useDatasets()

  const identidade = (nome: string | null, cpf: string | null) =>
    (cpf && cpf.trim()) || (nome ? nome.trim().toLowerCase() : '—')

  const linhas = useMemo<LinhaHistorico[]>(() => {
    // Total de disparos e presença por identidade (todas as unidades, sem filtro)
    const totalPorIdentidade = new Map<string, number>()
    const clienteIdParaIdentidade = new Map<string, string>()
    for (const cl of clientes) {
      clienteIdParaIdentidade.set(cl.id, identidade(cl.nome, cl.cpf))
    }
    const unidadesPorIdentidade = new Map<string, Set<string>>()
    for (const cl of clientes) {
      const key = identidade(cl.nome, cl.cpf)
      if (!unidadesPorIdentidade.has(key)) unidadesPorIdentidade.set(key, new Set())
      unidadesPorIdentidade.get(key)!.add(cl.unidade_id)
    }
    for (const e of enviosDetalhados) {
      const key = clienteIdParaIdentidade.get(e.cliente_id) ?? '—'
      totalPorIdentidade.set(key, (totalPorIdentidade.get(key) ?? 0) + 1)
    }

    const termo = busca.trim().toLowerCase()

    return enviosDetalhados
      .filter((e) => {
        if (unidadeId && e.unidade_id !== unidadeId) return false
        if (!incluirGrupoTeste && e.cliente_grupo_teste) return false
        if (termo && !e.cliente_nome.toLowerCase().includes(termo)) return false
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime(),
      )
      .map((e) => {
        const key = clienteIdParaIdentidade.get(e.cliente_id) ?? '—'
        return {
          ...e,
          total_disparos_cliente: totalPorIdentidade.get(key) ?? 0,
          multi_unidade: (unidadesPorIdentidade.get(key)?.size ?? 0) > 1,
        }
      })
  }, [enviosDetalhados, clientes, unidadeId, incluirGrupoTeste, busca])

  return { linhas, isLoading, error }
}
