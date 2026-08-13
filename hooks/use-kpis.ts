'use client'

import { useMemo } from 'react'
import { DIAS_APOS_COMPRA, LIMITE_ALERTA_ERRO } from '@/config/dashboard'
import { useDashboardFilters } from '@/hooks/use-dashboard-filters'
import { useDatasets, ultimosNDias } from '@/hooks/use-datasets'
import { chaveDia, contarStatus, filtrarEnvios } from '@/lib/data/selectors'

export interface Kpi {
  id: string
  label: string
  valor: number
  apoio?: string
  alerta?: boolean
  /** série de 7 dias para o mini-gráfico de tendência */
  trend: number[]
  tone: 'default' | 'success' | 'error' | 'neutral'
}

export function useKPIs() {
  const { inicioPeriodo, fimPeriodo, incluirGrupoTeste, unidade } =
    useDashboardFilters()
  const { enviosDetalhados, clientes, unidades, unidadeId, isLoading, error } =
    useDatasets()

  const kpis = useMemo<Kpi[]>(() => {
    const noPeriodo = filtrarEnvios(enviosDetalhados, {
      inicio: inicioPeriodo,
      fim: fimPeriodo,
      unidadeId,
      incluirGrupoTeste,
    })
    const c = contarStatus(noPeriodo)

    const dias = ultimosNDias(7)
    const serie = (pred: (s: string) => boolean) =>
      dias.map(
        (dia) =>
          enviosDetalhados.filter((e) => {
            if (unidadeId && e.unidade_id !== unidadeId) return false
            if (!incluirGrupoTeste && e.cliente_grupo_teste) return false
            return chaveDia(e.enviado_em) === dia && pred(e.status)
          }).length,
      )

    // Clientes na base (respeita unidade + grupo de teste)
    const clientesFiltrados = clientes.filter((cl) => {
      if (unidadeId && cl.unidade_id !== unidadeId) return false
      if (!incluirGrupoTeste && cl.grupo_teste) return false
      return true
    })

    // Opt-outs no período: bloqueios + clientes com opt_out marcado no período
    const optOutClientesPeriodo = clientes.filter((cl) => {
      if (unidadeId && cl.unidade_id !== unidadeId) return false
      if (!incluirGrupoTeste && cl.grupo_teste) return false
      if (!cl.opt_out || !cl.opt_out_em) return false
      const t = new Date(cl.opt_out_em).getTime()
      return t >= inicioPeriodo.getTime() && t <= fimPeriodo.getTime()
    }).length
    const optOutsPeriodo = c.opt_out + optOutClientesPeriodo

    // Elegíveis hoje: ultima_compra = hoje - 5 dias, opt_out false, sem envio p/ essa referência
    const alvo = new Date()
    alvo.setDate(alvo.getDate() - DIAS_APOS_COMPRA)
    const alvoKey = chaveDia(alvo.toISOString())
    const jaEnviados = new Set(
      enviosDetalhados.map((e) => `${e.cliente_id}:${chaveDia(e.referencia_compra ?? '')}`),
    )
    const elegiveis = clientes.filter((cl) => {
      if (unidadeId && cl.unidade_id !== unidadeId) return false
      if (!incluirGrupoTeste && cl.grupo_teste) return false
      if (cl.opt_out || !cl.ultima_compra) return false
      if (chaveDia(cl.ultima_compra) !== alvoKey) return false
      return !jaEnviados.has(`${cl.id}:${alvoKey}`)
    }).length

    // série 7d para base: novos clientes por dia de última compra
    const serieClientes = (pred: (dia: string, cl: (typeof clientes)[number]) => boolean) =>
      dias.map(
        (dia) =>
          clientesFiltrados.filter((cl) => pred(dia, cl)).length,
      )

    return [
      {
        id: 'total',
        label: 'Total de disparos',
        valor: c.total,
        apoio: `${c.tentativas} tentativas de entrega`,
        trend: serie(() => true),
        tone: 'default',
      },
      {
        id: 'entregues',
        label: 'Entregues',
        valor: c.enviado,
        apoio: Number.isFinite(c.taxaSucesso)
          ? `Taxa de sucesso ${(c.taxaSucesso * 100).toFixed(1).replace('.', ',')}%`
          : 'Sem tentativas no período',
        trend: serie((s) => s === 'enviado'),
        tone: 'success',
      },
      {
        id: 'falhas',
        label: 'Falhas',
        valor: c.erro,
        apoio: `${(c.taxaErro * 100).toFixed(1).replace('.', ',')}% das tentativas`,
        alerta: c.taxaErro > LIMITE_ALERTA_ERRO,
        trend: serie((s) => s === 'erro'),
        tone: 'error',
      },
      {
        id: 'base',
        label: 'Clientes na base',
        valor: clientesFiltrados.length,
        apoio:
          unidade === 'todas' ? 'Todas as unidades' : 'Unidade selecionada',
        trend: serieClientes((dia, cl) =>
          cl.ultima_compra ? chaveDia(cl.ultima_compra) === dia : false,
        ),
        tone: 'default',
      },
      {
        id: 'optouts',
        label: 'Opt-outs no período',
        valor: optOutsPeriodo,
        apoio: `${c.opt_out} bloqueados no disparo`,
        trend: serie((s) => s === 'opt_out_bloqueado'),
        tone: 'neutral',
      },
      {
        id: 'elegiveis',
        label: 'Elegíveis hoje',
        valor: elegiveis,
        apoio: `Próximo lote (compra há ${DIAS_APOS_COMPRA} dias)`,
        trend: serieClientes((dia, cl) => {
          if (cl.opt_out || !cl.ultima_compra) return false
          const d = new Date(dia + 'T00:00:00')
          d.setDate(d.getDate() - DIAS_APOS_COMPRA)
          return chaveDia(cl.ultima_compra) === chaveDia(d.toISOString())
        }),
        tone: 'default',
      },
    ] satisfies Kpi[]
  }, [
    enviosDetalhados,
    clientes,
    unidades,
    unidadeId,
    inicioPeriodo,
    fimPeriodo,
    incluirGrupoTeste,
    unidade,
  ])

  return { kpis, isLoading, error }
}
