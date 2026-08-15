"use client"

import useSWR from "swr"
import { LEMBRETES_API_ROUTE } from "@/config/lembretes"
import type { Lembrete } from "@/lib/types"

async function fetcher(url: string): Promise<{ lembretes: Lembrete[] }> {
  const resposta = await fetch(url)
  const data = await resposta.json().catch(() => ({}))
  if (!resposta.ok) throw new Error(data.error ?? "Falha ao carregar lembretes.")
  return data
}

export function useLembretes() {
  const { data, error, isLoading } = useSWR<{ lembretes: Lembrete[] }>(LEMBRETES_API_ROUTE, fetcher, {
    revalidateOnFocus: false,
  })
  return { lembretes: data?.lembretes ?? [], isLoading, error: error as Error | null }
}
