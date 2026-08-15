"use client"

/**
 * Card de destaque ("News From The Doctor" na referência) — aqui vira um
 * resumo operacional real: conexão do WhatsApp, taxa de falha vs. meta e
 * clientes elegíveis hoje. Tudo derivado de hooks que já existem
 * (useInstanciaStatus, useKPIs) — nenhum dado novo, só reorganizado em
 * destaque visual.
 */
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, Smartphone } from "lucide-react"
import { useInstanciaStatus } from "@/hooks/use-instancia-status"
import { useKPIs } from "@/hooks/use-kpis"
import { cn } from "@/lib/utils"

function Linha({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof CheckCircle2
  tone: "ok" | "alerta" | "info"
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "ok" && "text-white",
          tone === "alerta" && "text-amber-200",
          tone === "info" && "text-white/80",
        )}
      />
      <p className="text-sm text-white/95 text-pretty">{children}</p>
    </div>
  )
}

export function StatusHighlightCard() {
  const cambeba = useInstanciaStatus("cambeba", false)
  const guararapes = useInstanciaStatus("guararapes", false)
  const { kpis, isLoading } = useKPIs()

  const falhas = kpis.find((k) => k.id === "falhas")
  const elegiveis = kpis.find((k) => k.id === "elegiveis")

  const desconectadas = [
    cambeba.data?.state === "close" ? "Cambeba" : null,
    guararapes.data?.state === "close" ? "Guararapes" : null,
  ].filter(Boolean) as string[]
  const aindaVerificando = !cambeba.data || !guararapes.data

  return (
    <div className="card-elevated relative flex flex-col justify-between gap-4 overflow-hidden rounded-2xl bg-primary p-5 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(140% 100% at 0% 0%, var(--color-primary-dark), var(--color-primary) 60%)",
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-white/15">
          <Smartphone className="size-4" />
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">Status agora</span>
      </div>

      <div className="relative flex flex-col gap-2.5">
        <h2 className="text-base font-semibold">Status operacional</h2>

        {isLoading || aindaVerificando ? (
          <p className="text-sm text-white/80">Verificando integrações…</p>
        ) : (
          <>
            {desconectadas.length === 0 ? (
              <Linha icon={CheckCircle2} tone="ok">
                WhatsApp conectado nas duas unidades.
              </Linha>
            ) : (
              <Linha icon={AlertTriangle} tone="alerta">
                WhatsApp desconectado em {desconectadas.join(" e ")} —{" "}
                <Link href="/configuracoes" className="underline underline-offset-2">
                  reconectar
                </Link>
                .
              </Linha>
            )}

            {falhas?.alerta ? (
              <Linha icon={AlertTriangle} tone="alerta">
                Taxa de falha acima da meta no período ({falhas.apoio}).
              </Linha>
            ) : null}

            {elegiveis ? (
              <Linha icon={Clock} tone="info">
                {elegiveis.valor} cliente{elegiveis.valor === 1 ? "" : "s"} elegíve
                {elegiveis.valor === 1 ? "l" : "is"} hoje para o lembrete de recompra.
              </Linha>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
