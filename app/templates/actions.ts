"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { connectionState, evolutionConfigurada } from "@/lib/evolution/server"
import type { Template, TemplateInput, TipoInstanciaEvolution } from "@/lib/types"

const SELECT_COLUNAS =
  "id, unidade_id, nome, horario, dias_semana, dias_apos_compra, ativo, mensagem_template, imagem_url, quantidade_max, criado_em, atualizado_em"

/**
 * Só confirma que quem chama está logado no dash (middleware já barra rota
 * sem sessão, isto é defesa em profundidade). A leitura/escrita real em
 * disparos_agendados precisa do service_role — a tabela tem RLS habilitado
 * sem policies (deny-all via PostgREST), igual clientes/envios/importacoes;
 * o client autenticado normal (lib/supabase/server.ts) não enxerga nada
 * aqui, com ou sem sessão.
 */
async function exigirUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
}

/**
 * Qual instância o guard de ativação exige conectada. SEMPRE "producao"
 * por padrão — é o comportamento real, definitivo. EVOLUTION_GUARD_ATIVACAO
 * só existe pra validar o mecanismo do guard hoje contra a instância de
 * teste (que está conectada) sem editar lógica nenhuma: mesmo código,
 * mesmo caminho, só aponta pra outra instância. Setada pra "teste" no
 * .env.local por enquanto — REMOVER ou setar pra "producao" antes de
 * qualquer disparo real ir pro cliente final (ver .env.example).
 */
const INSTANCIA_DO_GUARD: TipoInstanciaEvolution =
  process.env.EVOLUTION_GUARD_ATIVACAO === "teste" ? "teste" : "producao"

/**
 * Mesmo guard de segurança que existia antes de disparos_agendados virar
 * "templates" desconectado: não deixa ativar um disparo sem o WhatsApp
 * (de produção, ver INSTANCIA_DO_GUARD acima) conectado, senão o cliente
 * acha que está tudo rodando e nada sai (foi exatamente o que causou o
 * "não disparo" relatado).
 *
 * Checa uma instância nomeada explicitamente, nunca "a" instância —
 * um disparo pode ter clientes com grupo_teste=false (achado 2026-08-18:
 * antes desta função existir separada por tipo, o guard olhava uma
 * variável única, que podia estar apontando pra instância de teste e
 * liberar ativação mesmo com produção desconectada).
 */
async function whatsappConectado(): Promise<boolean> {
  if (!evolutionConfigurada(INSTANCIA_DO_GUARD)) return false
  try {
    const { state } = await connectionState(INSTANCIA_DO_GUARD)
    return state === "open"
  } catch {
    return false
  }
}

function validar(input: TemplateInput): string | null {
  const nome = input.nome?.trim() ?? ""
  if (nome.length < 2) return "Dê um nome ao disparo (mín. 2 caracteres)."

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.horario ?? "")) return "Horário inválido."

  const diasSemana = Array.isArray(input.dias_semana) ? input.dias_semana : []
  if (diasSemana.length === 0) return "Selecione ao menos um dia da semana."
  if (diasSemana.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "Dia da semana inválido."

  if (!Number.isInteger(input.dias_apos_compra) || input.dias_apos_compra < 1) {
    return "Dias após a compra precisa ser um número inteiro maior que zero."
  }

  const mensagem = input.mensagem_template?.trim() ?? ""
  if (mensagem.length > 2000) return "A mensagem excede 2000 caracteres."
  if (!mensagem && !input.imagem_url) return "O disparo precisa ter mensagem, imagem, ou os dois."

  if (input.quantidade_max !== null) {
    if (!Number.isInteger(input.quantidade_max) || input.quantidade_max < 1) {
      return "Quantidade de envios precisa ser um número inteiro maior que zero."
    }
  }

  return null
}

export async function listarTemplates(): Promise<Template[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("disparos_agendados")
    .select(SELECT_COLUNAS)
    .order("criado_em", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Template[]
}

export async function criarTemplate(input: TemplateInput) {
  const erro = validar(input)
  if (erro) return { error: erro }
  await exigirUsuario()

  if (input.ativo && !(await whatsappConectado())) {
    return { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este disparo." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").insert({
    nome: input.nome.trim(),
    unidade_id: input.unidade_id,
    horario: input.horario,
    dias_semana: input.dias_semana,
    dias_apos_compra: input.dias_apos_compra,
    mensagem_template: input.mensagem_template?.trim() || null,
    imagem_url: input.imagem_url,
    quantidade_max: input.quantidade_max,
    ativo: input.ativo,
  })
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function atualizarTemplate(id: string, input: TemplateInput) {
  const erro = validar(input)
  if (erro) return { error: erro }
  await exigirUsuario()

  if (input.ativo && !(await whatsappConectado())) {
    return { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este disparo." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("disparos_agendados")
    .update({
      nome: input.nome.trim(),
      unidade_id: input.unidade_id,
      horario: input.horario,
      dias_semana: input.dias_semana,
      dias_apos_compra: input.dias_apos_compra,
      mensagem_template: input.mensagem_template?.trim() || null,
      imagem_url: input.imagem_url,
      quantidade_max: input.quantidade_max,
      ativo: input.ativo,
    })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function excluirTemplate(id: string) {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function alternarAtivo(id: string, ativo: boolean) {
  await exigirUsuario()

  if (ativo && !(await whatsappConectado())) {
    return { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este disparo." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").update({ ativo }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}
