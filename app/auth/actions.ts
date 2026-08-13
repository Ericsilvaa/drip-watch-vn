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
