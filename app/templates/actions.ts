"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TemplateInput } from "@/lib/types"

async function exigirUsuario() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Não autorizado")
  return supabase
}

function validar(input: TemplateInput) {
  const nome = input.nome?.trim() ?? ""
  const corpo = input.corpo?.trim() ?? ""
  if (nome.length < 2) return "Dê um nome ao template (mín. 2 caracteres)."
  if (corpo.length < 5) return "A mensagem está muito curta."
  if (corpo.length > 2000) return "A mensagem excede 2000 caracteres."
  return null
}

export async function criarTemplate(input: TemplateInput) {
  const erro = validar(input)
  if (erro) return { error: erro }
  const supabase = await exigirUsuario()
  const { error } = await supabase.from("templates").insert({
    nome: input.nome.trim(),
    descricao: input.descricao?.trim() || null,
    corpo: input.corpo.trim(),
    unidade_id: input.unidade_id,
    ativo: input.ativo,
  })
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function atualizarTemplate(id: string, input: TemplateInput) {
  const erro = validar(input)
  if (erro) return { error: erro }
  const supabase = await exigirUsuario()
  const { error } = await supabase
    .from("templates")
    .update({
      nome: input.nome.trim(),
      descricao: input.descricao?.trim() || null,
      corpo: input.corpo.trim(),
      unidade_id: input.unidade_id,
      ativo: input.ativo,
    })
    .eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function excluirTemplate(id: string) {
  const supabase = await exigirUsuario()
  const { error } = await supabase.from("templates").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}

export async function alternarAtivo(id: string, ativo: boolean) {
  const supabase = await exigirUsuario()
  const { error } = await supabase.from("templates").update({ ativo }).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/disparos")
  return { ok: true }
}
