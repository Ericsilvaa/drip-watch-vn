import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { connect, evolutionConfigurada } from "@/lib/evolution/server"
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

  const tipo = new URL(request.url).searchParams.get("tipo")
  if (!tipoValido(tipo)) {
    return NextResponse.json({ error: "Parâmetro 'tipo' precisa ser 'teste' ou 'producao'." }, { status: 400 })
  }

  if (!evolutionConfigurada(tipo)) {
    return NextResponse.json({ error: "Evolution API não configurada" }, { status: 503 })
  }

  try {
    const qr = await connect(tipo)
    return NextResponse.json(qr)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao gerar QR Code" },
      { status: 502 },
    )
  }
}
