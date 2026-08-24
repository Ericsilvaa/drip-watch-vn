"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { contarTentativasRecentes, verificarRateLimit } from "@/lib/rate-limit/server"

// Lockout de login por conta — além do piso já existente do Supabase Auth
// (30 tentativas/5min por IP, config.toml). Só conta tentativas malsucedidas;
// login certo nunca é bloqueado. Ver specs/001-hardening-seguranca (US2, FR-004).
const LOGIN_ESCOPO = "login"
const LOGIN_LIMITE = 5
const LOGIN_JANELA_SEGUNDOS = 900

export async function signInAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Informe e-mail e senha." }
  }

  const tentativasRecentes = await contarTentativasRecentes({
    escopo: LOGIN_ESCOPO,
    identificador: email,
    janelaSegundos: LOGIN_JANELA_SEGUNDOS,
  })
  if (tentativasRecentes >= LOGIN_LIMITE) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Registra só a falha — sucesso nunca conta pro limite.
    await verificarRateLimit({
      escopo: LOGIN_ESCOPO,
      identificador: email,
      limite: LOGIN_LIMITE,
      janelaSegundos: LOGIN_JANELA_SEGUNDOS,
    })

    // Genericamente para evitar enumeração de contas
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "E-mail ainda não confirmado. Verifique sua caixa de entrada." }
    }
    return { error: "E-mail ou senha inválidos." }
  }

  redirect("/")
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
