import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { connectionState, evolutionConfigurada, nomeInstancia } from "@/lib/evolution/server"
import { verificarRateLimit } from "@/lib/rate-limit/server"
import type { TipoInstanciaEvolution } from "@/lib/types"

function tipoValido(valor: string | null): valor is TipoInstanciaEvolution {
  return valor === "teste" || valor === "producao"
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  // Limite generoso de propósito: este endpoint é chamado a cada 4s pelo polling
  // de EvolutionConnect enquanto o QR está na tela (~15 req/min legítimo) — ver
  // components/configuracoes/evolution-connect.tsx. 60/min dá margem confortável.
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
    const { state, instance } = await connectionState(tipo)
    return NextResponse.json({ state, instance, number: null })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao consultar status", instance: nomeInstancia(tipo) },
      { status: 502 },
    )
  }
}
