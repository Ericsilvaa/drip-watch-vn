import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { LEMBRETE_IMAGEM_BUCKET, LEMBRETE_IMAGEM_TAMANHO_MAX_MB, LEMBRETE_IMAGEM_TIPOS } from "@/config/lembretes"

/**
 * Upload da imagem de um lembrete pro bucket lembretes-imagens (Supabase
 * Storage, leitura pública). Mesmo motivo de sempre passar pelo servidor:
 * nunca escrever com a chave anon do browser — aqui quem grava é o
 * service_role, igual ao resto de Configuração de Disparos.
 */
export const runtime = "nodejs"

function extensaoDe(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export async function POST(request: Request) {
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 })
  }

  const arquivo = form.get("arquivo")
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 })
  }
  if (!(LEMBRETE_IMAGEM_TIPOS as readonly string[]).includes(arquivo.type)) {
    return NextResponse.json(
      { error: `Formato não aceito. Use: ${LEMBRETE_IMAGEM_TIPOS.join(", ")}.` },
      { status: 400 },
    )
  }
  if (arquivo.size > LEMBRETE_IMAGEM_TAMANHO_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Imagem maior que ${LEMBRETE_IMAGEM_TAMANHO_MAX_MB}MB.` },
      { status: 400 },
    )
  }

  const caminho = `lembretes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensaoDe(arquivo.type)}`
  const supabase = createServiceClient()

  const { error: uploadError } = await supabase.storage
    .from(LEMBRETE_IMAGEM_BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data } = supabase.storage.from(LEMBRETE_IMAGEM_BUCKET).getPublicUrl(caminho)
  return NextResponse.json({ url: data.publicUrl })
}
