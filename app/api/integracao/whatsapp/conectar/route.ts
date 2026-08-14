import { NextResponse } from "next/server"
import { WHATSAPP_INSTANCIAS, type WhatsappUnidadeSlug } from "@/config/integracao"

/**
 * Proxy same-origin para GET /instance/connect/{instancia} na Evolution API
 * v2.3.7 — (re)conecta uma instância JÁ EXISTENTE e devolve QR/pairing code.
 * De propósito NÃO usa /instance/create: esse endpoint é só para instância
 * nova e pode reclamar de "instância já existe" ou resetar uma sessão já
 * pareada (ver seção 5 do contexto da v1 de Configurações).
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
    resposta = await fetch(`${apiUrl}/instance/connect/${instancia}`, {
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
  const rawBase64: string | undefined = data?.base64 ?? data?.qrcode?.base64

  if (!rawBase64) {
    return NextResponse.json(
      { error: "A Evolution API não retornou um QR Code. A instância já pode estar conectada." },
      { status: 502 },
    )
  }

  const qrcodeBase64 = rawBase64.startsWith("data:image")
    ? rawBase64
    : `data:image/png;base64,${rawBase64}`

  return NextResponse.json({
    qrcodeBase64,
    pairingCode: data?.pairingCode ?? null,
  })
}
