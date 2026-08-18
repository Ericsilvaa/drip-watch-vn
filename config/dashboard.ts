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

/**
 * Placeholders suportados nos templates. São substituídos por dados reais do
 * cliente no momento do disparo (pelo n8n/Evolution). No preview usamos
 * valores de exemplo.
 */
export const PLACEHOLDERS = [
  { chave: '{{nome}}', descricao: 'Primeiro nome do cliente', exemplo: 'Ana' },
  { chave: '{{unidade}}', descricao: 'Nome da unidade', exemplo: 'Lavateria Cambeba' },
] as const

export const PREVIEW_EXEMPLO: Record<string, string> = {
  '{{nome}}': 'Ana',
  '{{unidade}}': 'Lavateria Cambeba',
}

/** Rotas internas (same-origin) que fazem proxy para a Evolution API. */
export const EVOLUTION_STATUS_ROUTE = '/api/evolution/status'
export const EVOLUTION_CONNECT_ROUTE = '/api/evolution/connect'
export const EVOLUTION_LOGOUT_ROUTE = '/api/evolution/logout'
