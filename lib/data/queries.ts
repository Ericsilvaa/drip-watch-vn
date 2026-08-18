"use server"

/**
 * Camada de acesso a dados (somente leitura), como server actions.
 * clientes/envios/unidades/importacoes têm RLS habilitado sem policies
 * (deny-all via PostgREST) de propósito — dados sensíveis (CPF, telefone)
 * só podem sair por conexão de serviço, nunca pela chave anon/authenticated
 * do browser (ver docs/decisoes/2026-08-08-rls-sem-politicas-nas-tabelas.md
 * no repo lavateria-whatsapp-reminder). Por isso aqui é sempre
 * createServiceClient(), nunca o client do browser — os hooks em
 * hooks/use-raw-data.ts chamam estas funções como fetcher do SWR.
 */
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Cliente, Envio, Importacao, Unidade } from '@/lib/types'

async function exigirUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')
}

function assertNoError<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  return (data ?? []) as T
}

type ServiceClient = ReturnType<typeof createServiceClient>

async function queryUnidades(supabase: ServiceClient): Promise<Unidade[]> {
  const { data, error } = await supabase
    .from('unidades')
    .select('id, nome, cidade')
    .order('nome')
  return assertNoError<Unidade[]>(data as Unidade[], error)
}

async function queryClientes(supabase: ServiceClient): Promise<Cliente[]> {
  // telefone_e164/email não entram no select: nenhum componente do painel
  // exibe esses campos, então não há razão pra baixar esse PII pro browser.
  // cpf continua — é usado (só internamente, nunca exibido) pra identificar
  // o mesmo cliente cadastrado nas duas unidades (marcação "multi-unidade").
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, unidade_id, nome, cpf, ultima_compra, qtd_compras, valor_total, opt_out, opt_out_em, grupo_teste',
    )
  return assertNoError<Cliente[]>(data as Cliente[], error)
}

async function queryEnvios(supabase: ServiceClient): Promise<Envio[]> {
  const { data, error } = await supabase
    .from('envios')
    .select(
      'id, cliente_id, unidade_id, referencia_compra, canal, status, detalhe_erro, enviado_em',
    )
    .order('enviado_em', { ascending: false })
  return assertNoError<Envio[]>(data as Envio[], error)
}

async function queryImportacoes(supabase: ServiceClient): Promise<Importacao[]> {
  const { data, error } = await supabase
    .from('importacoes')
    .select(
      'id, unidade_id, arquivo, linhas_lidas, linhas_validas, linhas_rejeitadas, importado_em',
    )
    .order('importado_em', { ascending: false })
  return assertNoError<Importacao[]>(data as Importacao[], error)
}

export async function fetchUnidades(): Promise<Unidade[]> {
  await exigirUsuario()
  return queryUnidades(createServiceClient())
}

export interface DashboardData {
  unidades: Unidade[]
  clientes: Cliente[]
  envios: Envio[]
  importacoes: Importacao[]
}

/**
 * Busca unidades+clientes+envios+importacoes juntos, com uma única
 * verificação de auth (não 4) e um único client de serviço — os 4 datasets
 * só são consumidos juntos mesmo, via useDatasets(). Ver hooks/use-datasets.ts.
 */
export async function fetchDashboardData(): Promise<DashboardData> {
  await exigirUsuario()
  const supabase = createServiceClient()
  const [unidades, clientes, envios, importacoes] = await Promise.all([
    queryUnidades(supabase),
    queryClientes(supabase),
    queryEnvios(supabase),
    queryImportacoes(supabase),
  ])
  return { unidades, clientes, envios, importacoes }
}
