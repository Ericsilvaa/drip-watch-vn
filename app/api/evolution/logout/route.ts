import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logout, evolutionConfigurada } from "@/lib/evolution/server"
import { verificarRateLimit } from "@/lib/rate-limit/server"
import type { TipoInstanciaEvolution } from "@/lib/types"

function tipoValido(valor: string | null): valor is TipoInstanciaEvolution {
  return valor === "teste" || valor === "producao"
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  // Mesmo escopo/limite de connect e status (ver rationale lá) — os 3 endpoints
  // dividem o mesmo teto por usuário.
  const rateLimit = await verificarRateLimit({
    escopo: "api:evolution",
    identificador: user.id,
    limite: 60,
    janelaSegundos: 60,
  })
  if (!rateLimit.dentroDoLimite) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } })
  }

  const tipo = new URL(request.url).searchParams.get("tipo")
  if (!tipoValido(tipo)) {
    return NextResponse.json({ error: "Parâmetro 'tipo' precisa ser 'teste' ou 'producao'." }, { status: 400 })
  }

  if (!evolutionConfigurada(tipo)) {
    return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 })
  }

  try {
    await logout(tipo)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao desconectar" },
      { status: 502 },
    )
  }
}
