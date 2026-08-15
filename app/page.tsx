import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sanitizePreferencias } from "@/config/dashboard"
import { Dashboard } from "@/components/dashboard/dashboard"

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Dashboard
      preferencias={sanitizePreferencias(user.user_metadata?.preferencias)}
      fullName={(user.user_metadata?.full_name as string | undefined) ?? ""}
    />
  )
}
