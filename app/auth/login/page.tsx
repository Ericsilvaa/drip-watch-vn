import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ehDaEquipe } from "@/lib/auth/equipe"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/brand/logo"
import { dashboardConfig } from "@/config/dashboard"

export default async function LoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const daEquipe = user ? await ehDaEquipe(supabase) : false
  if (daEquipe) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground text-balance">
              {dashboardConfig.appName}
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">{dashboardConfig.appTagline}</p>
          </div>
        </div>

        {user && (
          <p
            className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            A conta {user.email} não tem acesso ao painel. Entre com a conta da equipe ou peça acesso ao Eric.
          </p>
        )}

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso restrito à equipe. Painel somente leitura.
        </p>
      </div>
    </main>
  )
}
