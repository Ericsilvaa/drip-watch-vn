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

/** Template de mensagem WhatsApp (tabela public.templates). */
export interface Template {
  id: string
  unidade_id: string | null
  nome: string
  descricao: string | null
  corpo: string
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Payload de criação/edição de template. */
export interface TemplateInput {
  nome: string
  descricao: string | null
  corpo: string
  unidade_id: string | null
  ativo: boolean
}

/** Estado da conexão com a Evolution API. */
export type EvolutionState = 'open' | 'connecting' | 'close' | 'unknown'

export interface EvolutionStatus {
  state: EvolutionState
  instance: string | null
  /** número/JID conectado, quando disponível */
  number: string | null
}
