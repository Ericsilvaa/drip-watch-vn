/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /*
   * O ambiente injeta as chaves do Supabase sem o prefixo NEXT_PUBLIC_
   * (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY). O cliente do browser precisa das
   * versões NEXT_PUBLIC_. Mapeamos aqui para que o Next inline os valores tanto
   * no servidor quanto no bundle do cliente — solução durável (sobrevive a pulls).
   */
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY,
  },
}

export default nextConfig
