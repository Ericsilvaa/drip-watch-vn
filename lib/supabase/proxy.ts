import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ehDaEquipe } from '@/lib/auth/equipe'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')

  // Painel só da equipe: sessão de quem não está em public.equipe é tratada
  // como sem sessão (volta pro login com aviso, sem loop pro "/").
  const daEquipe = user ? await ehDaEquipe(supabase) : false

  // Todo o painel fica atrás do login: qualquer rota que não seja /auth exige sessão da equipe.
  if (!daEquipe && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    if (user) url.searchParams.set('sem_acesso', '1')
    return NextResponse.redirect(url)
  }

  // Equipe logada tentando ver o login: manda pro painel.
  if (daEquipe && request.nextUrl.pathname === '/auth/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
