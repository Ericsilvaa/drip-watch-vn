import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { TipoInstanciaEvolution } from "@/lib/types"

/**
 * Gestão do número de WhatsApp pelo dashboard, via Edge Function
 * `evolution-instancia` (repo lavateria-whatsapp-reminder).
 *
 * O dashboard não guarda mais URL, chave nem nome de instância da Evolution
 * API: usa os mesmos secrets do Supabase que o disparo-diario e o
 * opt-out-webhook. Antes havia uma cópia em EVOLUTION_API_URL/KEY/INSTANCE_*
 * aqui, que ficou apontando pro Railway depois que ele expirou e quebrou a
 * tela de Configurações sem ninguém perceber.
 *
 * A chamada vai com o JWT do usuário logado; a função confere o login.
 */

const FUNCTIONS_URL = (
  process.env.SUPABASE_FUNCTIONS_URL ??
  (process.env.NEXT_PUBLIC_SUPABASE_URL ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1` : "")
).replace(/\/+$/, "")

export class EvolutionErro extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export function evolutionConfigurada() {
  return Boolean(FUNCTIONS_URL)
}

async function chamar<T>(corpo: {
  acao: "status" | "conectar" | "desconectar"
  tipo: TipoInstanciaEvolution
  numero?: string
}): Promise<T> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new EvolutionErro("Sessão expirada. Entre de novo.", 401)

  const res = await fetch(`${FUNCTIONS_URL}/evolution-instancia`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
    cache: "no-store",
  })
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null
  if (!res.ok || !data) {
    throw new EvolutionErro(data?.error ?? `Falha ao falar com o servidor (${res.status})`, res.status)
  }
  return data
}

/** Estado atual da conexão da instância (teste ou produção), com o número mascarado. */
export function connectionState(tipo: TipoInstanciaEvolution) {
  return chamar<{ state: string; instance: string; number: string | null }>({ acao: "status", tipo })
}

/**
 * Inicia a conexão: cria a instância se ainda não existir e devolve o QR Code
 * (`base64`) ou, se `numero` vier, o código de pareamento (`pairingCode`).
 */
export function connect(tipo: TipoInstanciaEvolution, numero?: string) {
  return chamar<{ base64: string | null; code: string | null; pairingCode: string | null; instance: string }>({
    acao: "conectar",
    tipo,
    ...(numero ? { numero } : {}),
  })
}

/** Desconecta o número atual da instância (a instância continua existindo). */
export function logout(tipo: TipoInstanciaEvolution) {
  return chamar<{ ok: true }>({ acao: "desconectar", tipo })
}
