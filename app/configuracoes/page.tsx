import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sanitizePreferencias } from "@/config/dashboard"
import { Configuracoes } from "@/components/configuracoes/configuracoes"

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Configuracoes
      email={user.email ?? ""}
      fullName={(user.user_metadata?.full_name as string | undefined) ?? ""}
      preferencias={sanitizePreferencias(user.user_metadata?.preferencias)}
    />
  )
}
