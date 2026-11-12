import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * O painel é só da equipe da loja: não basta ter conta no Supabase Auth, o
 * e-mail precisa estar em public.equipe (RPC eh_equipe, migration
 * 20261112210000_rls_so_equipe no lavateria-whatsapp-reminder). Os dados são
 * lidos com a chave de serviço depois desta checagem, então ela é o que
 * separa a equipe de qualquer conta criada no cadastro.
 */
export async function ehDaEquipe(supabase: Pick<SupabaseClient, "rpc">): Promise<boolean> {
  const { data, error } = await supabase.rpc("eh_equipe")
  return !error && data === true
}
