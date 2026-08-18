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

/** Endpoint interno (same-origin) que faz proxy do upload para a Edge Function importar-clientes (Supabase). */
export const IMPORT_API_ROUTE = '/api/importar-clientes'

export const ITENS_POR_PAGINA = 10

/**
 * Placeholders suportados nos disparos. Espelha exatamente o que
 * supabase/functions/disparo-diario/index.ts (substituirVariaveis) sabe
 * substituir no envio real — nenhum aqui é inventado; se mudar lá, mudar
 * aqui também. Substituição real acontece na Edge Function disparo-diario
 * (GitHub Actions → Evolution API), não em n8n. No preview usamos valores
 * de exemplo.
 */
export const PLACEHOLDERS = [
  { chave: '{{nome}}', descricao: 'Primeiro nome do cliente', exemplo: 'Ana' },
  { chave: '{{unidade}}', descricao: 'Nome da unidade', exemplo: 'Lavateria Cambeba' },
  { chave: '{{dias}}', descricao: 'Dias após a compra configurados neste disparo', exemplo: '5' },
  { chave: '{{dia_semana}}', descricao: 'Dia da semana do envio', exemplo: 'sexta-feira' },
  { chave: '{{hora}}', descricao: 'Horário configurado do disparo', exemplo: '09:00' },
  { chave: '{{data}}', descricao: 'Data do dia do envio', exemplo: '15/08' },
] as const

export const PREVIEW_EXEMPLO: Record<string, string> = {
  '{{nome}}': 'Ana',
  '{{unidade}}': 'Lavateria Cambeba',
  '{{dias}}': '5',
  '{{dia_semana}}': 'sexta-feira',
  '{{hora}}': '09:00',
  '{{data}}': '15/08',
}

/** Dias da semana pro seletor do disparo — mesmos valores de extract(dow) usados em disparos_agendados (0=domingo). */
export const DIAS_SEMANA_OPCOES = [
  { valor: 0, label: 'Dom' },
  { valor: 1, label: 'Seg' },
  { valor: 2, label: 'Ter' },
  { valor: 3, label: 'Qua' },
  { valor: 4, label: 'Qui' },
  { valor: 5, label: 'Sex' },
  { valor: 6, label: 'Sáb' },
] as const

/** Espelha TETO_ENVIOS_POR_EXECUCAO do Edge Function disparo-diario — só informativo aqui, não validado/editável. */
export const TETO_SEGURANCA_GLOBAL = 15

/** Upload de imagem do disparo — bucket público no Supabase Storage. */
export const IMAGEM_DISPARO_TIPOS = ['image/jpeg', 'image/png', 'image/webp'] as const
export const IMAGEM_DISPARO_TAMANHO_MAX_MB = 5
export const IMAGEM_DISPARO_BUCKET = 'lembretes-imagens'
export const IMAGEM_DISPARO_API_ROUTE = '/api/disparos/imagem'

/**
 * Rotas internas (same-origin) que fazem proxy para a Evolution API.
 * Cada uma exige `?tipo=teste|producao` — a Evolution API tem 2 instâncias
 * reais e as rotas nunca assumem qual delas por padrão (ver
 * TipoInstanciaEvolution em lib/types.ts).
 */
export const EVOLUTION_STATUS_ROUTE = '/api/evolution/status'
export const EVOLUTION_CONNECT_ROUTE = '/api/evolution/connect'
export const EVOLUTION_LOGOUT_ROUTE = '/api/evolution/logout'

export const INSTANCIAS_EVOLUTION: { tipo: 'teste' | 'producao'; titulo: string; descricao: string }[] = [
  {
    tipo: 'teste',
    titulo: 'Instância de teste',
    descricao: 'Número usado só pra validar disparos antes de irem pro cliente final.',
  },
  {
    tipo: 'producao',
    titulo: 'Instância de produção',
    descricao: 'Número que atende as unidades de verdade — é o que envia pro cliente final.',
  },
]
