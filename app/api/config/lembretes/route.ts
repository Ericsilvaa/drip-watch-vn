import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { validarLembrete } from "@/lib/validation/lembrete"
import type { Lembrete } from "@/lib/types"

/**
 * CRUD de disparos_agendados (Configuração de Disparos). Usa service_role
 * (lib/supabase/service.ts) — mesma fronteira de segurança do resto do
 * painel: nenhuma escrita com a chave anon do browser. Autenticação já é
 * garantida pelo middleware (lib/supabase/proxy.ts) antes de chegar aqui,
 * mesmo padrão de app/api/importar-clientes/route.ts.
 */
export const runtime = "nodejs"

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("disparos_agendados")
    .select("*")
    .order("criado_em", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lembretes: data as Lembrete[] })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })

  const validado = validarLembrete(body)
  if ("erro" in validado) return NextResponse.json({ error: validado.erro }, { status: 400 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("disparos_agendados")
    .insert(validado.valor)
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lembrete: data as Lembrete })
}
