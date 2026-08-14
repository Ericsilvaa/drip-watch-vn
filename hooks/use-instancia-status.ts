"use client"

/**
 * Status de conexão de uma instância WhatsApp (Evolution API), sempre
 * consultado ao vivo via /api/integracao/whatsapp/status — nunca cacheado
 * no Supabase. Polling curto só quando `pollingAtivo` (card expandido
 * aguardando escaneio); fora disso, busca uma vez e fica parado.
 */
import useSWR from "swr"
import { WHATSAPP_POLL_INTERVAL_MS, WHATSAPP_STATUS_API_ROUTE, type WhatsappUnidadeSlug } from "@/config/integracao"

export type WhatsappState = "open" | "connecting" | "close" | "unknown"

async function fetcher(url: string): Promise<{ state: WhatsappState }> {
  const resposta = await fetch(url)
  const data = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(data.error ?? "Falha ao consultar status.")
  }
  return data
}

export function useInstanciaStatus(unidade: WhatsappUnidadeSlug, pollingAtivo: boolean) {
  return useSWR<{ state: WhatsappState }>(
    `${WHATSAPP_STATUS_API_ROUTE}?unidade=${unidade}`,
    fetcher,
    {
      refreshInterval: pollingAtivo ? WHATSAPP_POLL_INTERVAL_MS : 0,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  )
}
