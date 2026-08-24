import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { verificarRateLimit } from "@/lib/rate-limit/server"
import { IMAGEM_DISPARO_BUCKET, IMAGEM_DISPARO_TAMANHO_MAX_MB, IMAGEM_DISPARO_TIPOS } from "@/config/dashboard"

/**
 * Upload da imagem de um disparo pro bucket lembretes-imagens (Supabase
 * Storage, leitura pública). Mesmo motivo de sempre passar pelo servidor:
 * nunca escrever com a chave anon do browser — aqui quem grava é o
 * service_role, igual ao resto do CRUD de disparos (app/templates/actions.ts).
 *
 * Checagem de sessão explícita aqui (defesa em profundidade, mesmo padrão
 * de /api/evolution/*) — antes dependia só do middleware (proxy.ts); ver
 * specs/001-hardening-seguranca (FR-006).
 */
export const runtime = "nodejs"

function extensaoDe(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export async function POST(request: Request) {
  const supabaseAuth = await createClient()
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const rateLimit = await verificarRateLimit({
    escopo: "api:disparos-imagem",
    identificador: user.id,
    limite: 20,
    janelaSegundos: 60,
  })
  if (!rateLimit.dentroDoLimite) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": "60" } })
  }

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
  if (!(IMAGEM_DISPARO_TIPOS as readonly string[]).includes(arquivo.type)) {
    return NextResponse.json(
      { error: `Formato não aceito. Use: ${IMAGEM_DISPARO_TIPOS.join(", ")}.` },
      { status: 400 },
    )
  }
  if (arquivo.size > IMAGEM_DISPARO_TAMANHO_MAX_MB * 1024 * 1024) {
    return NextResponse.json(
      { error: `Imagem maior que ${IMAGEM_DISPARO_TAMANHO_MAX_MB}MB.` },
      { status: 400 },
    )
  }

  const caminho = `lembretes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensaoDe(arquivo.type)}`
  const supabase = createServiceClient()

  const { error: uploadError } = await supabase.storage
    .from(IMAGEM_DISPARO_BUCKET)
    .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data } = supabase.storage.from(IMAGEM_DISPARO_BUCKET).getPublicUrl(caminho)
  return NextResponse.json({ url: data.publicUrl })
}
