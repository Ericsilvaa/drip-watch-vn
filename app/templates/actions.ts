"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { connectionState, evolutionConfigurada } from "@/lib/evolution/server"
import { CAMPANHA_HORA_MAX, CAMPANHA_HORA_MIN } from "@/config/dashboard"
import type { PublicoCampanha, Template, TemplateInput, TipoInstanciaEvolution } from "@/lib/types"

// Literal único (sem concatenar): o supabase-js infere o tipo do retorno a
// partir da string exata do select.
const SELECT_COLUNAS =
  "id, unidade_id, nome, tipo, horario, dias_semana, dias_apos_compra, ativo, mensagem_template, imagem_url, quantidade_max, data_inicio, data_fim, teto_diario, publico_dias_sem_compra_min, publico_dias_sem_compra_max, publico_compras_min, publico_valor_min, publico_aniversariantes_mes, concluido_em, arquivado_em, criado_em, atualizado_em"

/** Data de hoje em America/Fortaleza (YYYY-MM-DD) — o mesmo "hoje" que o disparo-diario usa. */
function hojeFortaleza(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza" }).format(new Date())
}

function inteiroOpcionalInvalido(v: number | null, min: number): boolean {
  return v !== null && (!Number.isInteger(v) || v < min)
}

/** Colunas gravadas em disparos_agendados, iguais pra criar e editar. */
function colunas(input: TemplateInput) {
  const campanha = input.tipo === "campanha"
  return {
    nome: input.nome.trim(),
    tipo: input.tipo,
    unidade_id: input.unidade_id,
    horario: input.horario,
    // Campanha ignora dias_semana/dias_apos_compra; grava os defaults da
    // tabela pra linha continuar válida se um dia virar régua.
    dias_semana: campanha ? [0, 1, 2, 3, 4, 5, 6] : input.dias_semana,
    dias_apos_compra: campanha ? 5 : input.dias_apos_compra,
    mensagem_template: input.mensagem_template?.trim() || null,
    imagem_url: input.imagem_url,
    quantidade_max: input.quantidade_max,
    ativo: input.ativo,
    data_inicio: campanha ? input.data_inicio : null,
    data_fim: campanha ? input.data_fim || null : null,
    teto_diario: campanha ? input.teto_diario : null,
    publico_dias_sem_compra_min: campanha ? input.publico_dias_sem_compra_min : null,
    publico_dias_sem_compra_max: campanha ? input.publico_dias_sem_compra_max : null,
    publico_compras_min: campanha ? input.publico_compras_min : null,
    publico_valor_min: campanha ? input.publico_valor_min : null,
    publico_aniversariantes_mes: campanha ? input.publico_aniversariantes_mes : false,
  }
}

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

function validarPublico(p: PublicoCampanha): string | null {
  if (inteiroOpcionalInvalido(p.publico_dias_sem_compra_min, 0) || inteiroOpcionalInvalido(p.publico_dias_sem_compra_max, 0)) {
    return "Dias sem vir precisa ser um número inteiro (0 ou mais)."
  }
  if (
    p.publico_dias_sem_compra_min !== null &&
    p.publico_dias_sem_compra_max !== null &&
    p.publico_dias_sem_compra_max < p.publico_dias_sem_compra_min
  ) {
    return "Em \"dias sem vir\", o máximo não pode ser menor que o mínimo."
  }
  if (inteiroOpcionalInvalido(p.publico_compras_min, 0)) return "Compras mínimas precisa ser um número inteiro (0 ou mais)."
  if (p.publico_valor_min !== null && (!Number.isFinite(p.publico_valor_min) || p.publico_valor_min < 0)) {
    return "Valor gasto mínimo inválido."
  }
  return null
}

function validar(input: TemplateInput, criando: boolean): string | null {
  const nome = input.nome?.trim() ?? ""
  if (nome.length < 2) return "Dê um nome ao disparo (mín. 2 caracteres)."
  if (input.tipo !== "regua" && input.tipo !== "campanha") return "Tipo de disparo inválido."

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(input.horario ?? "")) return "Horário inválido."

  if (input.tipo === "regua") {
    const diasSemana = Array.isArray(input.dias_semana) ? input.dias_semana : []
    if (diasSemana.length === 0) return "Selecione ao menos um dia da semana."
    if (diasSemana.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return "Dia da semana inválido."

    if (!Number.isInteger(input.dias_apos_compra) || input.dias_apos_compra < 1) {
      return "Dias após a compra precisa ser um número inteiro maior que zero."
    }
  } else {
    const hora = Number(input.horario.slice(0, 2))
    if (hora < CAMPANHA_HORA_MIN || hora > CAMPANHA_HORA_MAX) {
      return `Campanha começa entre ${CAMPANHA_HORA_MIN}h e ${CAMPANHA_HORA_MAX}h (janela comercial de envio).`
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data_inicio ?? "")) return "Escolha a data da campanha."
    // Só na criação: editar uma campanha já em andamento não pode travar
    // porque a data de início ficou no passado.
    if (criando && input.data_inicio! < hojeFortaleza()) return "A data da campanha não pode estar no passado."
    if (input.data_fim) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.data_fim)) return "Data final inválida."
      if (input.data_fim < input.data_inicio!) return "A data final não pode ser antes da data de início."
    }
    if (inteiroOpcionalInvalido(input.teto_diario, 1)) return "Envios por dia precisa ser um número inteiro maior que zero."
    const erroPublico = validarPublico(input)
    if (erroPublico) return erroPublico
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

/**
 * "visiveis" (default) = tela principal, `arquivado_em is null`.
 * "arquivados" = só os arquivados, pra tela de gerenciar arquivo.
 * Arquivar/desarquivar são ações independentes de `ativo` — ver
 * docs/decisoes/2026-09-15-arquivar-templates-com-historico.md
 * (lavateria-whatsapp-reminder).
 */
export async function listarTemplates(filtro: "visiveis" | "arquivados" = "visiveis"): Promise<Template[]> {
  await exigirUsuario()
  const supabase = createServiceClient()
  let query = supabase.from("disparos_agendados").select(SELECT_COLUNAS)
  query = filtro === "arquivados" ? query.not("arquivado_em", "is", null) : query.is("arquivado_em", null)
  const { data, error } = await query.order("criado_em", { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Template[]
}

export async function criarTemplate(input: TemplateInput) {
  const erro = validar(input, true)
  if (erro) return { error: erro }
  await exigirUsuario()

  if (input.ativo && !(await whatsappConectado())) {
    return { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este disparo." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").insert(colunas(input))
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function atualizarTemplate(id: string, input: TemplateInput) {
  const erro = validar(input, false)
  if (erro) return { error: erro }
  await exigirUsuario()

  if (input.ativo && !(await whatsappConectado())) {
    return { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este disparo." }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from("disparos_agendados")
    // Editar uma campanha concluída reabre: quem já recebeu continua fora
    // (o banco deduplica por cliente+campanha), só quem entrou pelo filtro
    // novo ou pela data nova recebe.
    .update({ ...colunas(input), concluido_em: null })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

/**
 * Prévia do form: quantos clientes entram com estes filtros hoje (opt-out e
 * sem telefone já excluídos). Não considera quem já recebeu a campanha —
 * é o tamanho do público, pra estimar quantos dias ela leva.
 */
export async function previaPublicoCampanha(publico: PublicoCampanha): Promise<{ total: number } | { error: string }> {
  const erro = validarPublico(publico)
  if (erro) return { error: erro }
  await exigirUsuario()

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("contar_publico_campanha", {
    p_unidade_id: publico.unidade_id,
    p_dias_sem_compra_min: publico.publico_dias_sem_compra_min,
    p_dias_sem_compra_max: publico.publico_dias_sem_compra_max,
    p_compras_min: publico.publico_compras_min,
    p_valor_min: publico.publico_valor_min,
    p_aniversariantes_mes: publico.publico_aniversariantes_mes,
  })
  if (error) return { error: error.message }
  return { total: (data as number | null) ?? 0 }
}

export async function excluirTemplate(id: string) {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").delete().eq("id", id)
  if (error) {
    // 23503 = foreign key violation — disparo já tem envios em `envios`
    // (envios_disparo_agendado_id_fkey). Excluir apagaria o vínculo com
    // histórico real de mensagens já mandadas, então o banco recusa por
    // design (não é bug de schema). Traduz pra ação que o usuário pode
    // tomar em vez de expor o erro cru do Postgres.
    if (error.code === "23503") {
      return {
        error: "Esse disparo já tem envios registrados e não pode ser excluído (perderia o histórico).",
        // Sinaliza pro toast oferecer o botão "Arquivar" direto na notificação,
        // em vez do usuário ter que caçar o ícone no card depois de ler o erro.
        podeArquivar: true as const,
      }
    }
    return { error: error.message }
  }
  revalidatePath("/disparos")
  return { ok: true }
}

/**
 * Tira o template da tela principal sem apagar dado nenhum (útil pra quem
 * já tem `envios` vinculados e não pode ser excluído fisicamente — ver
 * excluirTemplate acima). Sempre força ativo=false: arquivado nunca
 * dispara, mesmo se `disparos_devidos_agora`/`disparos_ativos_hoje`
 * (backend) já filtram arquivado_em is null por conta própria — dupla
 * garantia, não confiar só no filtro da UI.
 */
export async function arquivarTemplate(id: string) {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("disparos_agendados")
    .update({ arquivado_em: new Date().toISOString(), ativo: false })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

/**
 * Volta o template pra tela principal. NÃO reativa sozinho (ativo continua
 * false) — reativar é decisão separada do usuário, pelo toggle normal, que
 * já tem o guard de WhatsApp conectado.
 */
export async function desarquivarTemplate(id: string) {
  await exigirUsuario()
  const supabase = createServiceClient()
  const { error } = await supabase
    .from("disparos_agendados")
    .update({ arquivado_em: null })
    .eq("id", id)
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

  if (ativo) {
    // Campanha concluída não volta pelo toggle: sem mudar data ou público,
    // ela seria encerrada de novo na próxima execução. Reabrir é pelo Editar.
    const { data: atual } = await supabase.from("disparos_agendados").select("concluido_em").eq("id", id).single()
    if (atual?.concluido_em) {
      return { error: "Essa campanha já foi concluída. Para reabrir, edite a data ou o público." }
    }
  }

  const { error } = await supabase.from("disparos_agendados").update({ ativo }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}
