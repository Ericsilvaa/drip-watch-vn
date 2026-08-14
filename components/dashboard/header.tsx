import { LogOut } from "lucide-react"
import { signOutAction } from "@/app/auth/actions"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { dashboardConfig } from "@/config/dashboard"

export function Header({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Logo className="size-9 rounded-lg" />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              {dashboardConfig.appName}
              <span className="font-normal text-muted-foreground"> — {dashboardConfig.appBrand}</span>
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {dashboardConfig.appTagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground md:inline">{email}</span>
          <form action={signOutAction}>
            <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}
