import "server-only"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Client fino para a RPC verificar_rate_limit (Postgres, projeto Supabase
 * compartilhado com o backend). Mesmo contrato usado nas Edge Functions —
 * ver lavateria-whatsapp-reminder/specs/001-hardening-seguranca/contracts/rpc-rate-limit.md.
 * Rate limit de PROTEÇÃO DE ENDPOINT (força bruta/abuso), não confundir com
 * o rate limit de envio do WhatsApp (isso é outro sistema, no backend).
 */

export interface RateLimitParams {
  escopo: string
  identificador: string
  limite: number
  janelaSegundos: number
}

export interface RateLimitResultado {
  /** true = dentro do limite (aceitar). false = excedeu OU a checagem falhou — ver `erro`. */
  dentroDoLimite: boolean
  /** true quando a própria checagem falhou (RPC indisponível) — quem chama decide fail-open/fail-closed. */
  erro: boolean
}

export async function verificarRateLimit(params: RateLimitParams): Promise<RateLimitResultado> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("verificar_rate_limit", {
    p_escopo: params.escopo,
    p_identificador: params.identificador,
    p_limite: params.limite,
    p_janela_segundos: params.janelaSegundos,
  })

  if (error) {
    return { dentroDoLimite: false, erro: true }
  }

  return { dentroDoLimite: Boolean(data), erro: false }
}

/** Extrai o IP de origem do primeiro valor de X-Forwarded-For, com fallback fixo. */
export function ipDeOrigem(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  const primeiro = xff?.split(",")[0]?.trim()
  return primeiro || "desconhecido"
}

/**
 * Leitura sem efeito colateral (não registra tentativa) — usada só pelo
 * login: precisa saber SE a conta já está bloqueada ANTES de chamar
 * supabase.auth.signInWithPassword, sem contar essa checagem como uma nova
 * tentativa (senão todo login, inclusive os certos, consumiria o próprio
 * limite). A gravação de fato acontece só em caso de falha, via
 * verificarRateLimit — mesma lógica de "só conta o que é indesejado" usada
 * nos secrets de trigger do backend.
 */
export async function contarTentativasRecentes(params: {
  escopo: string
  identificador: string
  janelaSegundos: number
}): Promise<number> {
  const supabase = createServiceClient()
  const desde = new Date(Date.now() - params.janelaSegundos * 1000).toISOString()
  const { count, error } = await supabase
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("escopo", params.escopo)
    .eq("identificador", params.identificador)
    .gt("criado_em", desde)

  if (error) return 0 // fail-open na leitura — quem falha fechado é o registro da tentativa em si, não o peek
  return count ?? 0
}
