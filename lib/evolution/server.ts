import "server-only"
import type { TipoInstanciaEvolution } from "@/lib/types"

/**
 * Cliente server-only da Evolution API.
 * As credenciais (URL, key, instância) NUNCA vão ao browser — só as rotas-proxy
 * em app/api/evolution/* chamam estas funções.
 *
 * A Evolution API tem 2 instâncias reais, geridas separadamente (ver
 * TipoInstanciaEvolution em lib/types.ts) — nunca uma variável única
 * representando "a" instância. EVOLUTION_INSTANCE_PRODUCAO hoje ainda
 * aponta pro nome real em produção (lavateria-cambeba); quando ela for
 * renomeada na própria Evolution API (decisão pendente — nome final
 * "lavateria-fast", pra refletir que 1 instância atende as 2 unidades),
 * esta env var precisa ser atualizada junto, senão as chamadas passam a
 * mirar um instanceName que não existe mais.
 */

const BASE = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "") ?? ""
const KEY = process.env.EVOLUTION_API_KEY ?? ""
const INSTANCIAS: Record<TipoInstanciaEvolution, string> = {
  teste: process.env.EVOLUTION_INSTANCE_TESTE ?? "",
  producao: process.env.EVOLUTION_INSTANCE_PRODUCAO ?? "",
}

function nomeDe(tipo: TipoInstanciaEvolution): string {
  return INSTANCIAS[tipo]
}

export function evolutionConfigurada(tipo: TipoInstanciaEvolution) {
  return Boolean(BASE && KEY && nomeDe(tipo))
}

export function nomeInstancia(tipo: TipoInstanciaEvolution) {
  return nomeDe(tipo)
}

async function req(path: string, init?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { apikey: KEY, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  })
  const texto = await res.text()
  let json: unknown = null
  try {
    json = texto ? JSON.parse(texto) : null
  } catch {
    json = texto
  }
  if (!res.ok) {
    const fromBody =
      json && typeof json === "object" && "message" in json
        ? String((json as { message: unknown }).message)
        : ""
    throw new Error(fromBody || `Evolution API respondeu ${res.status}`)
  }
  return json
}

/** Estado atual da conexão da instância (teste ou produção). */
export async function connectionState(tipo: TipoInstanciaEvolution) {
  const instance = nomeDe(tipo)
  const data = (await req(`/instance/connectionState/${instance}`)) as {
    instance?: { instanceName?: string; state?: string }
  }
  const state = data?.instance?.state ?? "unknown"
  return { state, instance: data?.instance?.instanceName ?? instance }
}

/**
 * Inicia a conexão e obtém o QR Code da instância (teste ou produção).
 * A resposta pode trazer `base64` (imagem pronta) e/ou `code`/`pairingCode`.
 */
export async function connect(tipo: TipoInstanciaEvolution) {
  const instance = nomeDe(tipo)
  const data = (await req(`/instance/connect/${instance}`)) as {
    base64?: string
    code?: string
    pairingCode?: string
    count?: number
  }
  return {
    base64: data?.base64 ?? null,
    code: data?.code ?? null,
    pairingCode: data?.pairingCode ?? null,
  }
}

/** Desconecta a instância (teste ou produção). */
export async function logout(tipo: TipoInstanciaEvolution) {
  const instance = nomeDe(tipo)
  await req(`/instance/logout/${instance}`, { method: "DELETE" })
  return { ok: true }
}
