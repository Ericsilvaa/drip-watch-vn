import { NextResponse } from "next/server"
import { IMPORT_EXTENSOES, IMPORT_TAMANHO_MAX_MB } from "@/config/dashboard"

/**
 * Proxy same-origin para o Form Trigger do workflow n8n
 * `01-captura-importacao-clientes.json`. O browser fala só com esta rota
 * (mesma origem, sem CORS); é este handler, rodando no servidor, que faz o
 * POST pro n8n. Não escreve no Supabase — quem valida, normaliza telefone e
 * grava em `clientes`/`importacoes` continua sendo o workflow já existente.
 *
 * Requer a variável de ambiente N8N_IMPORT_WEBHOOK_URL (sem prefixo
 * NEXT_PUBLIC_ — não precisa, e não deve, ficar exposta no browser).
 */
export const runtime = "nodejs"

function extensaoValida(nomeArquivo: string): boolean {
  const nome = nomeArquivo.toLowerCase()
  return IMPORT_EXTENSOES.some((ext) => nome.endsWith(ext))
}

export async function POST(request: Request) {
  const webhookUrl = process.env.N8N_IMPORT_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error:
          "N8N_IMPORT_WEBHOOK_URL não configurada no servidor. Defina essa variável de ambiente apontando para a URL pública do Form Trigger do workflow 01.",
      },
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

  // O Form Trigger do n8n espera os campos do multipart por POSIÇÃO
  // (field-0, field-1, ...), não pelo fieldLabel — achado real de teste,
  // ver docs/decisoes/2026-08-08-bugs-corrigidos-workflow-01-importacao.md.
  // Ordem do form original (01-captura-importacao-clientes.json): Unidade
  // primeiro, Arquivo depois.
  const outgoing = new FormData()
  outgoing.append("field-0", unidade)
  outgoing.append("field-1", arquivo, arquivo.name)

  let resposta: Response
  try {
    resposta = await fetch(webhookUrl, { method: "POST", body: outgoing })
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível conectar ao n8n. Verifique se o túnel/n8n local está no ar (o import depende da máquina do Eric estar ligada, Fase A).",
      },
      { status: 502 },
    )
  }

  const texto = await resposta.text().catch(() => "")

  if (!resposta.ok) {
    return NextResponse.json(
      { error: texto || `O n8n respondeu com erro (status ${resposta.status}).` },
      { status: 502 },
    )
  }

  return NextResponse.json({
    message:
      texto || "Recebido! O processamento e a atualização da base ocorrem em segundo plano.",
  })
}
