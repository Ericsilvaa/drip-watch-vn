/**
 * Configuração central do painel.
 * Constantes e flags que mudam com frequência ficam aqui — evita hardcode
 * espalhado pelos componentes. Ajustar metas/limites é só editar este arquivo.
 */

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

/**
 * URL pública do Form Trigger do workflow n8n `01-captura-importacao-clientes.json`.
 * NUNCA hardcode — muda entre fases de infra (túnel Tailscale local hoje, VPS no H12).
 * Definir em NEXT_PUBLIC_N8N_IMPORT_WEBHOOK_URL. Vazio => painel avisa que a importação
 * está indisponível, sem quebrar a tela.
 */
export const N8N_IMPORT_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_IMPORT_WEBHOOK_URL ?? ''

export const ITENS_POR_PAGINA = 10
