/**
 * Camada de acesso a dados (somente leitura).
 * Funções puras que leem do Supabase. Nenhum componente importa o supabase
 * diretamente — tudo passa por aqui, o que permite trocar/ajustar uma query
 * sem tocar na UI. Erros de leitura (ex: RLS bloqueando) são propagados para
 * o SWR tratar e a UI exibir o estado de erro.
 */
import { createClient } from '@/lib/supabase/client'
import type { Cliente, Envio, Importacao, Template, Unidade } from '@/lib/types'

function assertNoError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return (data ?? []) as T
}

export async function fetchUnidades(): Promise<Unidade[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('unidades')
    .select('id, nome, cidade')
    .order('nome')
  return assertNoError<Unidade[]>(data as Unidade[], error)
}

export async function fetchClientes(): Promise<Cliente[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, unidade_id, nome, cpf, telefone_e164, email, ultima_compra, qtd_compras, valor_total, opt_out, opt_out_em, grupo_teste',
    )
  return assertNoError<Cliente[]>(data as Cliente[], error)
}

export async function fetchEnvios(): Promise<Envio[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('envios')
    .select(
      'id, cliente_id, unidade_id, referencia_compra, canal, status, detalhe_erro, enviado_em',
    )
    .order('enviado_em', { ascending: false })
  return assertNoError<Envio[]>(data as Envio[], error)
}

export async function fetchTemplates(): Promise<Template[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('templates')
    .select('id, unidade_id, nome, descricao, corpo, ativo, criado_em, atualizado_em')
    .order('criado_em', { ascending: false })
  return assertNoError<Template[]>(data as Template[], error)
}

export async function fetchImportacoes(): Promise<Importacao[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('importacoes')
    .select(
      'id, unidade_id, arquivo, linhas_lidas, linhas_validas, linhas_rejeitadas, importado_em',
    )
    .order('importado_em', { ascending: false })
  return assertNoError<Importacao[]>(data as Importacao[], error)
}
