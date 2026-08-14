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
  /** Usado só internamente (marcação multi-unidade) — nunca exibido na UI. */
  cpf: string | null
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
