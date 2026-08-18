'use client'

/**
 * Base compartilhada da camada de dados. Cada dataset é buscado uma vez via SWR
 * e deduplicado por chave — múltiplos hooks de domínio consomem o mesmo cache
 * sem refazer a requisição. Os hooks de domínio (useKPIs, useEnviosPorDia, ...)
 * derivam suas métricas em cima disto, mantendo a UI isolada do fetch.
 */
import useSWR from 'swr'
import { fetchDashboardData, fetchUnidades, type DashboardData } from '@/lib/data/queries'
import { listarTemplates } from '@/app/templates/actions'
import type { Template, Unidade } from '@/lib/types'

const SWR_OPTS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
}

export function useUnidadesRaw() {
  return useSWR<Unidade[]>('unidades', fetchUnidades, SWR_OPTS)
}
/** unidades+clientes+envios+importacoes num único fetch — ver fetchDashboardData(). */
export function useDashboardDataRaw() {
  return useSWR<DashboardData>('dashboard-data', fetchDashboardData, SWR_OPTS)
}
export function useTemplatesRaw() {
  return useSWR<Template[]>('templates', listarTemplates, SWR_OPTS)
}
