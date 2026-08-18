import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Cliente com service_role — bypassa RLS. disparos_agendados (como clientes/
 * envios/importacoes) tem RLS habilitado sem policies (deny-all), então
 * escrita autenticada via lib/supabase/server.ts não funciona aqui; só
 * server actions/route handlers podem usar este client, nunca um componente
 * client — a chave nunca pode chegar ao browser.
 */
let serviceClient: SupabaseClient | undefined

export function createServiceClient() {
  if (serviceClient) return serviceClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // NUNCA cair pra SUPABASE_SECRET_KEY/SUPABASE_URL (sem NEXT_PUBLIC_) — no
  // Vercel deste projeto essas vêm de uma integração desconectada, apontando
  // pra outro projeto Supabase (confirmado em 2026-08-18: "Invalid API key"
  // ao usar SUPABASE_SECRET_KEY contra NEXT_PUBLIC_SUPABASE_URL). Tem que
  // ser exatamente esta variável, configurada manualmente com a service_role
  // key do projeto real (Supabase → Settings → API).
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Pegar em Supabase → Settings → API → service_role e colar no .env.local (nunca prefixar com NEXT_PUBLIC_).',
    )
  }

  serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return serviceClient
}
