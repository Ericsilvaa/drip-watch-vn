'use client'

/**
 * Base compartilhada da camada de dados. Cada dataset é buscado uma vez via SWR
 * e deduplicado por chave — múltiplos hooks de domínio consomem o mesmo cache
 * sem refazer a requisição. Os hooks de domínio (useKPIs, useEnviosPorDia, ...)
 * derivam suas métricas em cima disto, mantendo a UI isolada do fetch.
 */
import useSWR from 'swr'
import {
  fetchClientes,
  fetchEnvios,
  fetchImportacoes,
  fetchUnidades,
} from '@/lib/data/queries'
import { listarTemplates } from '@/app/templates/actions'
import type { Cliente, Envio, Importacao, Template, Unidade } from '@/lib/types'

const SWR_OPTS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
}

export function useUnidadesRaw() {
  return useSWR<Unidade[]>('unidades', fetchUnidades, SWR_OPTS)
}
export function useClientesRaw() {
  return useSWR<Cliente[]>('clientes', fetchClientes, SWR_OPTS)
}
export function useEnviosRaw() {
  return useSWR<Envio[]>('envios', fetchEnvios, SWR_OPTS)
}
export function useImportacoesRaw() {
  return useSWR<Importacao[]>('importacoes', fetchImportacoes, SWR_OPTS)
}
export function useTemplatesRaw() {
  return useSWR<Template[]>('templates', listarTemplates, SWR_OPTS)
}
