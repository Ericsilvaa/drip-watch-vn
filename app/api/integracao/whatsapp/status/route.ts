import { NextResponse } from "next/server"
import { WHATSAPP_INSTANCIAS, type WhatsappUnidadeSlug } from "@/config/integracao"

/**
 * Proxy same-origin para GET /instance/connectionState/{instancia} na
 * Evolution API. Nunca expõe EVOLUTION_API_KEY no client — só devolve o
 * estado da conexão. Não escreve nada no Supabase (ver Não-objetivo da v1 de
 * Configurações: estado é sempre consultado ao vivo).
 */
export const runtime = "nodejs"

function unidadeValida(valor: string | null): valor is WhatsappUnidadeSlug {
  return !!valor && valor in WHATSAPP_INSTANCIAS
}

export async function GET(request: Request) {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "EVOLUTION_API_URL / EVOLUTION_API_KEY não configuradas no servidor." },
      { status: 500 },
    )
  }

  const { searchParams } = new URL(request.url)
  const unidade = searchParams.get("unidade")

  if (!unidadeValida(unidade)) {
    return NextResponse.json({ error: "Unidade inválida." }, { status: 400 })
  }

  const instancia = WHATSAPP_INSTANCIAS[unidade]

  let resposta: Response
  try {
    resposta = await fetch(`${apiUrl}/instance/connectionState/${instancia}`, {
      headers: { apikey: apiKey },
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar à Evolution API." }, { status: 502 })
  }

  if (!resposta.ok) {
    return NextResponse.json(
      { error: `Evolution API respondeu com erro (status ${resposta.status}).` },
      { status: 502 },
    )
  }

  const data = await resposta.json().catch(() => null)
  const state: string = data?.instance?.state ?? data?.state ?? "unknown"

  return NextResponse.json({ state })
}
