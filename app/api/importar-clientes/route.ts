import { NextResponse } from "next/server"
import { IMPORT_EXTENSOES, IMPORT_TAMANHO_MAX_MB } from "@/config/dashboard"

/**
 * Proxy same-origin para a Edge Function `importar-clientes` (Supabase).
 * O browser fala só com esta rota (mesma origem, sem CORS, sessão do
 * usuário já validada aqui); é este handler, rodando no servidor, que
 * encaminha pra Edge Function com o trigger secret de baixo privilégio.
 * Não escreve no Supabase diretamente — quem valida, normaliza telefone e
 * grava em `clientes`/`importacoes` é a Edge Function.
 *
 * Migrado do n8n local (Tailscale Funnel) em 2026-08-17 — o import parou
 * de funcionar assim que o n8n foi desligado (dependência de máquina
 * ligada, o mesmo problema que motivou migrar disparo/opt-out/heartbeat).
 * Ver docs/decisoes (lavateria-whatsapp-reminder) da mesma data.
 *
 * Requer SUPABASE_FUNCTIONS_URL e IMPORT_TRIGGER_SECRET (sem prefixo
 * NEXT_PUBLIC_ — nunca deve chegar ao browser).
 */
export const runtime = "nodejs"

function extensaoValida(nomeArquivo: string): boolean {
  const nome = nomeArquivo.toLowerCase()
  return IMPORT_EXTENSOES.some((ext) => nome.endsWith(ext))
}

export async function POST(request: Request) {
  const functionsUrl = process.env.SUPABASE_FUNCTIONS_URL
  const triggerSecret = process.env.IMPORT_TRIGGER_SECRET

  if (!functionsUrl || !triggerSecret) {
    return NextResponse.json(
      { error: "SUPABASE_FUNCTIONS_URL / IMPORT_TRIGGER_SECRET não configuradas no servidor." },
      { status: 500 },
    )
  }

  let incoming: FormData
  try {
    incoming = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 })
  }

  const unidade = incoming.get("unidade")
  const arquivo = incoming.get("arquivo")

  if (typeof unidade !== "string" || !unidade.trim()) {
    return NextResponse.json({ error: "Selecione a unidade." }, { status: 400 })
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ error: "Selecione um arquivo." }, { status: 400 })
  }
  if (!extensaoValida(arquivo.name)) {
    return NextResponse.json(
      { error: `Formato não aceito. Use: ${IMPORT_EXTENSOES.join(", ")}.` },
      { status: 400 },
    )
  }
  if (arquivo.size > IMPORT_TAMANHO_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Arquivo maior que ${IMPORT_TAMANHO_MAX_MB}MB.` },
      { status: 400 },
    )
  }

  const outgoing = new FormData()
  outgoing.append("unidade", unidade)
  outgoing.append("arquivo", arquivo, arquivo.name)

  let resposta: Response
  try {
    resposta = await fetch(`${functionsUrl}/importar-clientes`, {
      method: "POST",
      headers: { "x-trigger-secret": triggerSecret },
      body: outgoing,
    })
  } catch {
    return NextResponse.json(
      { error: "Não foi possível conectar à Edge Function de importação." },
      { status: 502 },
    )
  }

  const data = await resposta.json().catch(() => ({}))

  if (!resposta.ok) {
    return NextResponse.json(
      { error: data.error ?? `A importação respondeu com erro (status ${resposta.status}).` },
      { status: 502 },
    )
  }

  return NextResponse.json(data)
}
