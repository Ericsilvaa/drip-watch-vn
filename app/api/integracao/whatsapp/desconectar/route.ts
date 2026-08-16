import { NextResponse } from "next/server"
import { WHATSAPP_INSTANCIA } from "@/config/integracao"

/**
 * Proxy same-origin para DELETE /instance/logout/{instancia} na Evolution
 * API v2 — desconecta a sessão do WhatsApp SEM apagar a instância. Endpoint
 * distinto de /instance/delete (que removeria a instância do banco da
 * Evolution API); aqui só derruba a sessão pareada, permitindo reconectar
 * depois pela mesma tela.
 */
export const runtime = "nodejs"

export async function POST() {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "EVOLUTION_API_URL / EVOLUTION_API_KEY não configuradas no servidor." },
      { status: 500 },
    )
  }

  let resposta: Response
  try {
    resposta = await fetch(`${apiUrl}/instance/logout/${WHATSAPP_INSTANCIA}`, {
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
