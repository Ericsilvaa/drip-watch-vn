import type { StatusEnvio } from '@/config/dashboard'

export interface Unidade {
  id: string
  nome: string
  cidade: string
}

export interface Cliente {
  id: string
  unidade_id: string
  nome: string
  cpf: string | null
  telefone_e164: string | null
  email: string | null
  ultima_compra: string | null
  qtd_compras: number
  valor_total: number
  opt_out: boolean
  opt_out_em: string | null
  grupo_teste: boolean
}

export interface Envio {
  id: string
  cliente_id: string
  unidade_id: string
  referencia_compra: string | null
  canal: string
  status: StatusEnvio
  detalhe_erro: string | null
  enviado_em: string
}

export interface Importacao {
  id: string
  unidade_id: string
  arquivo: string
  linhas_lidas: number
  linhas_validas: number
  linhas_rejeitadas: number
  importado_em: string
}

/** Envio já enriquecido com nome do cliente e unidade, para as tabelas. */
export interface EnvioDetalhado extends Envio {
  cliente_nome: string
  unidade_nome: string
  cliente_grupo_teste: boolean
  cliente_cpf: string | null
}

/** Linha do histórico: envio + total do cliente + flag multi-unidade. */
export interface LinhaHistorico extends EnvioDetalhado {
  total_disparos_cliente: number
  multi_unidade: boolean
}

/**
 * Regra de disparo (tabela public.disparos_agendados — é o que
 * supabase/functions/disparo-diario realmente lê via RPC
 * disparos_devidos_agora/clientes_elegiveis). "Template" aqui é só o nome
 * do conceito na UI; os campos têm que bater com a tabela real, senão o
 * CRUD grava algo que o disparo nunca vai ler.
 */
/**
 * regua = lembrete de recompra (X dias após a compra, dias da semana).
 * campanha = envio numa data escolhida pra um público filtrado — ver
 * docs/prd/EPICO_CAMPANHA_POR_DATA.md no repo lavateria-whatsapp-reminder.
 */
export type TipoDisparo = 'regua' | 'campanha'

/** Filtros de público da campanha. null/false = sem filtro. */
export interface PublicoCampanha {
  unidade_id: string | null
  publico_dias_sem_compra_min: number | null
  publico_dias_sem_compra_max: number | null
  publico_compras_min: number | null
  publico_valor_min: number | null
  publico_aniversariantes_mes: boolean
}

export interface Template {
  id: string
  unidade_id: string | null
  nome: string
  tipo: TipoDisparo
  horario: string
  dias_semana: number[]
  dias_apos_compra: number
  ativo: boolean
  mensagem_template: string | null
  imagem_url: string | null
  quantidade_max: number | null
  /** Campanha: primeiro e último dia de envio (YYYY-MM-DD). null na régua. */
  data_inicio: string | null
  data_fim: string | null
  /** Campanha: máximo de envios por dia. null = padrão TETO_DIARIO_CAMPANHA_PADRAO. */
  teto_diario: number | null
  publico_dias_sem_compra_min: number | null
  publico_dias_sem_compra_max: number | null
  publico_compras_min: number | null
  publico_valor_min: number | null
  publico_aniversariantes_mes: boolean
  /** Campanha: preenchido quando todo o público recebeu ou passou de data_fim. */
  concluido_em: string | null
  /** null = visível na tela principal. Timestamp = arquivado (independente de `ativo`). */
  arquivado_em: string | null
  criado_em: string
  atualizado_em: string
}

/** Payload de criação/edição de disparo. */
export interface TemplateInput extends PublicoCampanha {
  nome: string
  tipo: TipoDisparo
  horario: string
  dias_semana: number[]
  dias_apos_compra: number
  ativo: boolean
  mensagem_template: string | null
  imagem_url: string | null
  quantidade_max: number | null
  data_inicio: string | null
  data_fim: string | null
  teto_diario: number | null
}

/** Estado da conexão com a Evolution API. */
export type EvolutionState = 'open' | 'connecting' | 'close' | 'unknown'

export interface EvolutionStatus {
  state: EvolutionState
  instance: string | null
  /** número/JID conectado, quando disponível */
  number: string | null
}

/**
 * A Evolution API tem 2 instâncias reais (ver docs/decisoes/2026-08-16-
 * instancia-por-grupo-teste.md no repo lavateria-whatsapp-reminder):
 * "teste" é pra onde clientes com grupo_teste=true são roteados,
 * "producao" atende as unidades de verdade. O dashboard precisa gerenciar
 * as duas separadamente — nunca as trata como uma coisa só.
 */
export type TipoInstanciaEvolution = 'teste' | 'producao'
