import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ehDaEquipe } from "@/lib/auth/equipe"
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

/**
 * Tipo real pelos primeiros bytes. O `type` do File vem do navegador e pode
 * ser qualquer coisa; a Evolution manda o arquivo pro cliente como imagem.
 */
function tipoPelosBytes(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png"
  const ascii = (inicio: number, fim: number) => String.fromCharCode(...bytes.slice(inicio, fim))
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp"
  return null
}

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
  if (!user || !(await ehDaEquipe(supabaseAuth))) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

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

  const tipoReal = tipoPelosBytes(new Uint8Array(await arquivo.slice(0, 12).arrayBuffer()))
  if (tipoReal === null || tipoReal !== arquivo.type) {
    return NextResponse.json(
      { error: `O arquivo não é uma imagem ${IMAGEM_DISPARO_TIPOS.join(", ")} de verdade.` },
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
