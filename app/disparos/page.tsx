import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DisparosPage } from "@/components/pages/disparos-page"

export default async function Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <DisparosPage email={user.email ?? ""} />
}
