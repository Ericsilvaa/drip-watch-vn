/**
 * Configuração central do painel.
 * Constantes e flags que mudam com frequência ficam aqui — evita hardcode
 * espalhado pelos componentes. Ajustar metas/limites é só editar este arquivo.
 */

export const dashboardConfig = {
  appName: 'Painel de Disparos',
  appBrand: 'Lavateria Fast',
  appTagline: 'Monitoramento dos lembretes de recompra via WhatsApp',
} as const

export type PeriodoKey = 'hoje' | '7d' | '30d' | 'custom'

export const PERIODOS: { key: PeriodoKey; label: string; dias: number | null }[] = [
  { key: 'hoje', label: 'Hoje', dias: 1 },
  { key: '7d', label: '7 dias', dias: 7 },
  { key: '30d', label: '30 dias', dias: 30 },
  { key: 'custom', label: 'Personalizado', dias: null },
]

export const PERIODO_PADRAO: PeriodoKey = '7d'

/** Unidades do piloto. Fonte de verdade para labels; ids vêm do banco. */
export const UNIDADES = [
  { slug: 'todas', nome: 'Todas as unidades', nomeCurto: 'Todas' },
  { slug: 'cambeba', nome: 'Lavateria Cambeba', nomeCurto: 'Cambeba' },
  { slug: 'guararapes', nome: 'Lavateria Guararapes', nomeCurto: 'Guararapes' },
] as const

export type UnidadeSlug = (typeof UNIDADES)[number]['slug']

/** Metas e limites de alerta do negócio. */
export const META_TAXA_SUCESSO = 0.95 // 95%
export const LIMITE_ALERTA_ERRO = 0.05 // destaca falhas acima de 5% das tentativas

/** Janela da régua: lembrete dispara 5 dias após a última compra. */
export const DIAS_APOS_COMPRA = 5

/** Status possíveis de um envio (coluna envios.status). */
export const STATUS_ENVIO = {
  enviado: { label: 'Enviado', tone: 'success' as const },
  erro: { label: 'Erro', tone: 'error' as const },
  opt_out_bloqueado: { label: 'Opt-out (bloqueado)', tone: 'neutral' as const },
}

export type StatusEnvio = keyof typeof STATUS_ENVIO

/** Extensões e tamanho máximo aceitos no upload de importação (validação no client). */
export const IMPORT_EXTENSOES = ['.xlsx', '.xls', '.csv'] as const
export const IMPORT_TAMANHO_MAX_MB = 10

/** Endpoint interno (same-origin) que faz proxy do upload para o webhook do n8n. */
export const IMPORT_API_ROUTE = '/api/importar-clientes'

export const ITENS_POR_PAGINA = 10

/** Opções de itens por página oferecidas em Preferências. */
export const ITENS_POR_PAGINA_OPCOES = [10, 25, 50] as const

/** Períodos oferecidos como "período padrão ao abrir" — exclui 'custom', que depende de um intervalo já escolhido. */
export const PERIODOS_PADRAO_SELECIONAVEIS = PERIODOS.filter((p) => p.key !== 'custom')

export interface PreferenciasPainel {
  unidadePadrao: UnidadeSlug
  periodoPadrao: PeriodoKey
  incluirGrupoTestePadrao: boolean
  itensPorPagina: number
}

export const PREFERENCIAS_PADRAO: PreferenciasPainel = {
  unidadePadrao: 'todas',
  periodoPadrao: PERIODO_PADRAO,
  incluirGrupoTestePadrao: false,
  itensPorPagina: ITENS_POR_PAGINA,
}

/**
 * Preferências vêm de user_metadata (Supabase Auth) — mesmo caminho já usado
 * pro nome de exibição, fora das tabelas de negócio e da política RLS
 * deny-all. Sanitiza valores desconhecidos/antigos caindo no padrão.
 */
export function sanitizePreferencias(valor: unknown): PreferenciasPainel {
  const obj = (valor ?? {}) as Partial<PreferenciasPainel>

  const unidadePadrao = UNIDADES.some((u) => u.slug === obj.unidadePadrao)
    ? (obj.unidadePadrao as UnidadeSlug)
    : PREFERENCIAS_PADRAO.unidadePadrao

  const periodoPadrao = PERIODOS_PADRAO_SELECIONAVEIS.some((p) => p.key === obj.periodoPadrao)
    ? (obj.periodoPadrao as PeriodoKey)
    : PREFERENCIAS_PADRAO.periodoPadrao

  const incluirGrupoTestePadrao =
    typeof obj.incluirGrupoTestePadrao === 'boolean'
      ? obj.incluirGrupoTestePadrao
      : PREFERENCIAS_PADRAO.incluirGrupoTestePadrao

  const itensPorPagina = (ITENS_POR_PAGINA_OPCOES as readonly number[]).includes(obj.itensPorPagina as number)
    ? (obj.itensPorPagina as number)
    : PREFERENCIAS_PADRAO.itensPorPagina

  return { unidadePadrao, periodoPadrao, incluirGrupoTestePadrao, itensPorPagina }
}
