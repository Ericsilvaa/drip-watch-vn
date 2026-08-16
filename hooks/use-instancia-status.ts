"use client"

/**
 * Status de conexão da instância WhatsApp (Evolution API, uma só pras duas
 * unidades — ver config/integracao.ts), sempre consultado ao vivo via
 * /api/integracao/whatsapp/status — nunca cacheado no Supabase. Polling
 * curto só quando `pollingAtivo` (card expandido aguardando escaneio); fora
 * disso, busca uma vez e fica parado.
 */
import useSWR from "swr"
import { WHATSAPP_POLL_INTERVAL_MS, WHATSAPP_STATUS_API_ROUTE } from "@/config/integracao"

export type WhatsappState = "open" | "connecting" | "close" | "unknown"

async function fetcher(url: string): Promise<{ state: WhatsappState }> {
  const resposta = await fetch(url)
  const data = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(data.error ?? "Falha ao consultar status.")
  }
  return data
}

export function useInstanciaStatus(pollingAtivo: boolean) {
  return useSWR<{ state: WhatsappState }>(WHATSAPP_STATUS_API_ROUTE, fetcher, {
    refreshInterval: pollingAtivo ? WHATSAPP_POLL_INTERVAL_MS : 0,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
}
