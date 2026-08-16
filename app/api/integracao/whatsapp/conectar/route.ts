import { NextResponse } from "next/server"
import { WHATSAPP_INSTANCIA } from "@/config/integracao"

/**
 * Proxy same-origin para conectar a instância WhatsApp (Evolution API
 * v2.3.7) e devolver QR/pairing code.
 *
 * Se a instância já existe, usa GET /instance/connect/{instancia}
 * (reconecta uma sessão existente). Se não existe ainda (nunca foi
 * criada — ex: primeiro setup, ou depois de deletada), cria na hora via
 * POST /instance/create com qrcode:true, que já devolve o QR na mesma
 * resposta — nenhum passo manual fora do dash.
 */
export const runtime = "nodejs"

function extrairQr(data: unknown): { qrcodeBase64: string; pairingCode: string | null } | null {
  const body = data as { base64?: string; qrcode?: { base64?: string }; pairingCode?: string } | null
  const rawBase64 = body?.base64 ?? body?.qrcode?.base64
  if (!rawBase64) return null
  const qrcodeBase64 = rawBase64.startsWith("data:image") ? rawBase64 : `data:image/png;base64,${rawBase64}`
  return { qrcodeBase64, pairingCode: body?.pairingCode ?? null }
}

export async function POST() {
  const apiUrl = process.env.EVOLUTION_API_URL
  const apiKey = process.env.EVOLUTION_API_KEY

  if (!apiUrl || !apiKey) {
    return NextResponse.json(
      { error: "EVOLUTION_API_URL / EVOLUTION_API_KEY não configuradas no servidor." },
      { status: 500 },
    )
  }

  const headers = { apikey: apiKey, "Content-Type": "application/json" }

  let estado: Response
  try {
    estado = await fetch(`${apiUrl}/instance/connectionState/${WHATSAPP_INSTANCIA}`, {
      headers,
      cache: "no-store",
    })
  } catch {
    return NextResponse.json({ error: "Não foi possível conectar à Evolution API." }, { status: 502 })
  }

  let resposta: Response
  try {
    if (estado.status === 404) {
      resposta = await fetch(`${apiUrl}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instanceName: WHATSAPP_INSTANCIA,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      })
    } else if (estado.ok) {
      resposta = await fetch(`${apiUrl}/instance/connect/${WHATSAPP_INSTANCIA}`, { headers, cache: "no-store" })
    } else {
      return NextResponse.json(
        { error: `Evolution API respondeu com erro (status ${estado.status}).` },
        { status: 502 },
      )
    }
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
  const qr = extrairQr(data)

  if (!qr) {
    return NextResponse.json(
      { error: "A Evolution API não retornou um QR Code. A instância já pode estar conectada." },
      { status: 502 },
    )
  }

  return NextResponse.json(qr)
}
