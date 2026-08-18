import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { connectionState, evolutionConfigurada, nomeInstancia } from "@/lib/evolution/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  if (!evolutionConfigurada()) {
    return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 })
  }

  try {
    const { state, instance } = await connectionState()
    return NextResponse.json({ state, instance, number: null })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao consultar status", instance: nomeInstancia() },
      { status: 502 },
    )
  }
}
