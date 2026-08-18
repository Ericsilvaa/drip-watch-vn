import { createClient } from '@supabase/supabase-js'

/**
 * Cliente com service_role — bypassa RLS. disparos_agendados (como clientes/
 * envios/importacoes) tem RLS habilitado sem policies (deny-all), então
 * escrita autenticada via lib/supabase/server.ts não funciona aqui; só
 * server actions/route handlers podem usar este client, nunca um componente
 * client — a chave nunca pode chegar ao browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // SUPABASE_SERVICE_ROLE_KEY (nome usado em .env.local) e SUPABASE_SECRET_KEY
  // (nome que este projeto usa no Vercel — nomenclatura nova do Supabase,
  // publishable/secret em vez de anon/service_role) são a mesma chave;
  // aceita os dois pra não depender de qual ambiente está rodando.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada.')
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY não configurada. Pegar em Supabase → Settings → API → service_role (ou "secret" na nomenclatura nova) e colar no .env.local (nunca prefixar com NEXT_PUBLIC_).',
    )
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
