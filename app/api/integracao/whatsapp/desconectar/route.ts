import { NextResponse } from "next/server"
import { WHATSAPP_INSTANCIAS, type WhatsappUnidadeSlug } from "@/config/integracao"

/**
 * Proxy same-origin para DELETE /instance/logout/{instancia} na Evolution
 * API v2 — desconecta a sessão do WhatsApp SEM apagar a instância. Endpoint
 * distinto de /instance/delete (que removeria a instância do banco da
 * Evolution API); aqui só derruba a sessão pareada, permitindo reconectar
 * depois pela mesma tela.
 */
export const runtime = "nodejs"

function unidadeValida(valor: unknown): valor is WhatsappUnidadeSlug {
  return typeof valor === "string" && valor in WHATSAPP_INSTANCIAS
}

export async function POST(request: Request) {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "EVOLUTION_API_URL / EVOLUTION_API_KEY não configuradas no servidor." },
      { status: 500 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const unidade = (body as { unidade?: unknown } | null)?.unidade

  if (!unidadeValida(unidade)) {
    return NextResponse.json({ error: "Unidade inválida." }, { status: 400 })
  }

  const instancia = WHATSAPP_INSTANCIAS[unidade]

  let resposta: Response
  try {
    resposta = await fetch(`${apiUrl}/instance/logout/${instancia}`, {
      method: "DELETE",
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

  return NextResponse.json({ message: "WhatsApp desconectado." })
}
