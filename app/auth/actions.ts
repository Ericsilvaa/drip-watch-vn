"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Informe e-mail e senha." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensagem sempre genérica, sem exceção — "email not confirmed" tinha uma
    // mensagem própria antes, mas isso vaza se a conta existe (confirmada ou
    // não) pra quem estiver testando e-mails. Achado de enumeração de conta,
    // corrigido em 2026-08-24 (auditoria de segurança).
    return { error: "E-mail ou senha inválidos." }
  }

  redirect("/")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
