"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"

export function AppShell({
  email,
  title,
  subtitle,
  actions,
  children,
}: {
  email: string
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="min-h-svh app-glow">
      <Sidebar email={email} open={menuAberto} onClose={() => setMenuAberto(false)} />

      <div className="flex min-h-svh flex-col lg:pl-[17.25rem]">
        <Topbar onOpenMenu={() => setMenuAberto(true)} title={title} subtitle={subtitle} actions={actions} />

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
