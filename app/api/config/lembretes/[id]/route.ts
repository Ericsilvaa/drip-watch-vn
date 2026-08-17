import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { validarLembrete } from "@/lib/validation/lembrete"
import { instanciaWhatsappConectada } from "@/lib/integracao/instancia-status"
import type { Lembrete } from "@/lib/types"

export const runtime = "nodejs"

/**
 * PATCH aceita atualização parcial — usado tanto pro formulário de edição
 * completo quanto pro toggle rápido de ativo/inativo na lista (que só
 * manda { ativo: boolean }).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })

  const validado = validarLembrete(body, true)
  if ("erro" in validado) return NextResponse.json({ error: validado.erro }, { status: 400 })
  if (Object.keys(validado.valor).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 })
  }

  if (validado.valor.ativo && !(await instanciaWhatsappConectada())) {
    return NextResponse.json(
      { error: "WhatsApp desconectado — conecte em Configurações antes de ativar este lembrete." },
      { status: 409 },
    )
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("disparos_agendados")
    .update(validado.valor)
    .eq("id", id)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lembrete: data as Lembrete })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.from("disparos_agendados").delete().eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
