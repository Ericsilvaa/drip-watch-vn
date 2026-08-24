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
import { createHash } from 'node:crypto'
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

export async function fetchUnidades(): Promise<Unidade[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('unidades')
    .select('id, nome, cidade')
    .order('nome')
  return assertNoError<Unidade[]>(data as Unidade[], error)
}

/** sha256 truncado — só precisa ser estável (mesmo cpf → mesmo hash) e não-reversível, não precisa de sal (não é senha). */
function hashCpf(cpf: string | null): string | null {
  if (!cpf) return null
  return createHash('sha256').update(cpf).digest('hex').slice(0, 16)
}

export async function fetchClientes(): Promise<Cliente[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  // telefone_e164/email não entram no select: nenhum componente do painel
  // exibe esses campos, então não há razão pra baixar esse PII pro browser.
  // cpf é buscado aqui (server-side) só pra virar hash antes de sair desta
  // função — o CPF em texto puro nunca chega ao browser (ver comentário em
  // lib/types.ts#Cliente.identidade_hash). O hash serve exatamente pro
  // mesmo propósito que o CPF cru servia: chave de agrupamento em
  // hooks/use-historico-disparos.ts pra detectar cliente multi-unidade.
  const { data, error } = await supabase
    .from('clientes')
    .select(
      'id, unidade_id, nome, cpf, ultima_compra, qtd_compras, valor_total, opt_out, opt_out_em, grupo_teste',
    )
  const rows = assertNoError<(Cliente & { cpf?: string | null })[]>(
    data as (Cliente & { cpf?: string | null })[],
    error,
  )
  return rows.map(({ cpf, ...resto }) => ({
    ...resto,
    identidade_hash: hashCpf(cpf ?? null),
  }))
}

export async function fetchEnvios(): Promise<Envio[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('envios')
    .select(
      'id, cliente_id, unidade_id, referencia_compra, canal, status, detalhe_erro, enviado_em',
    )
    .order('enviado_em', { ascending: false })
  return assertNoError<Envio[]>(data as Envio[], error)
}

export async function fetchImportacoes(): Promise<Importacao[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('importacoes')
    .select(
      'id, unidade_id, arquivo, linhas_lidas, linhas_validas, linhas_rejeitadas, importado_em',
    )
    .order('importado_em', { ascending: false })
  return assertNoError<Importacao[]>(data as Importacao[], error)
}
