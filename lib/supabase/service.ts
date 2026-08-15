import { createClient } from '@supabase/supabase-js'

/**
 * Cliente com service_role — bypassa RLS, igual ao Edge Function
 * disparo-diario (mesma fronteira de segurança já usada lá). Só pode ser
 * importado em código server-side (app/api/**), nunca num componente
 * client — a chave nunca pode chegar ao browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY não configurada. Pegar em Supabase → Settings → API → service_role e colar no .env.local (nunca prefixar com NEXT_PUBLIC_).',
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
