import "server-only"

/**
 * Cliente server-only da Evolution API.
 * As credenciais (URL, key, instância) NUNCA vão ao browser — só as rotas-proxy
 * em app/api/evolution/* chamam estas funções.
 */

const BASE = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "") ?? ""
const KEY = process.env.EVOLUTION_API_KEY ?? ""
const INSTANCE = process.env.EVOLUTION_INSTANCE_NAME ?? ""

export function evolutionConfigurada() {
  return Boolean(BASE && KEY && INSTANCE)
}

export function nomeInstancia() {
  return INSTANCE
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

/** Estado atual da conexão da instância. */
export async function connectionState() {
  const data = (await req(`/instance/connectionState/${INSTANCE}`)) as {
    instance?: { instanceName?: string; state?: string }
  }
  const state = data?.instance?.state ?? "unknown"
  return { state, instance: data?.instance?.instanceName ?? INSTANCE }
}

/**
 * Inicia a conexão e obtém o QR Code.
 * A resposta pode trazer `base64` (imagem pronta) e/ou `code`/`pairingCode`.
 */
export async function connect() {
  const data = (await req(`/instance/connect/${INSTANCE}`)) as {
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

/** Desconecta a instância (logout). */
export async function logout() {
  await req(`/instance/logout/${INSTANCE}`, { method: "DELETE" })
  return { ok: true }
}
