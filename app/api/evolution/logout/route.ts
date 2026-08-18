import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logout, evolutionConfigurada } from "@/lib/evolution/server"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  if (!evolutionConfigurada()) {
    return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 })
  }

  try {
    await logout()
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao desconectar" },
      { status: 502 },
    )
  }
}
