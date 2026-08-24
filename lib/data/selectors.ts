/**
 * Seletores puros — a lógica de derivação de métricas vive aqui, longe da UI e
 * do fetch. Recebem dados brutos + filtros e devolvem estruturas prontas para
 * os componentes. Testáveis isoladamente.
 */
import type { UnidadeSlug } from '@/config/dashboard'
import type {
  Cliente,
  Envio,
  EnvioDetalhado,
  Unidade,
} from '@/lib/types'

export function resolveUnidadeId(
  unidades: Unidade[],
  slug: UnidadeSlug,
): string | null {
  if (slug === 'todas') return null
  const u = unidades.find((u) => u.nome.toLowerCase().includes(slug))
  return u?.id ?? null
}

export function enrichEnvios(
  envios: Envio[],
  clientes: Cliente[],
  unidades: Unidade[],
): EnvioDetalhado[] {
  const clienteMap = new Map(clientes.map((c) => [c.id, c]))
  const unidadeMap = new Map(unidades.map((u) => [u.id, u]))
  return envios.map((e) => {
    const c = clienteMap.get(e.cliente_id)
    const u = unidadeMap.get(e.unidade_id)
    return {
      ...e,
      cliente_nome: c?.nome ?? 'Cliente removido',
      unidade_nome: u?.nome ?? '—',
      cliente_grupo_teste: c?.grupo_teste ?? false,
    }
  })
}

interface FiltroEnvios {
  inicio: Date
  fim: Date
  unidadeId: string | null
  incluirGrupoTeste: boolean
}

export function filtrarEnvios(
  envios: EnvioDetalhado[],
  { inicio, fim, unidadeId, incluirGrupoTeste }: FiltroEnvios,
): EnvioDetalhado[] {
  return envios.filter((e) => {
    const t = new Date(e.enviado_em).getTime()
    if (t < inicio.getTime() || t > fim.getTime()) return false
    if (unidadeId && e.unidade_id !== unidadeId) return false
    if (!incluirGrupoTeste && e.cliente_grupo_teste) return false
    return true
  })
}

/** Conta status numa lista de envios. */
export function contarStatus(envios: EnvioDetalhado[]) {
  let enviado = 0
  let erro = 0
  let opt_out = 0
  for (const e of envios) {
    if (e.status === 'enviado') enviado++
    else if (e.status === 'erro') erro++
    else if (e.status === 'opt_out_bloqueado') opt_out++
  }
  const total = enviado + erro + opt_out
  const tentativas = enviado + erro // opt-out não é tentativa de entrega
  return {
    enviado,
    erro,
    opt_out,
    total,
    tentativas,
    taxaSucesso: tentativas > 0 ? enviado / tentativas : NaN,
    taxaErro: tentativas > 0 ? erro / tentativas : 0,
  }
}

/** Chave de dia local (yyyy-mm-dd) para agrupar séries temporais. */
export function chaveDia(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
