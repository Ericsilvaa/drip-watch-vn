"use client"

import { useEffect, useRef, useState } from "react"
import { mutate } from "swr"
import { toast } from "sonner"
import { Loader2, RefreshCw, Smartphone } from "lucide-react"
import { toneClass } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useInstanciaStatus, type WhatsappState } from "@/hooks/use-instancia-status"
import {
  WHATSAPP_CONECTAR_API_ROUTE,
  WHATSAPP_DESCONECTAR_API_ROUTE,
  WHATSAPP_QR_TIMEOUT_MS,
  WHATSAPP_STATUS_API_ROUTE,
} from "@/config/integracao"
import { cn } from "@/lib/utils"

const ESTADO_META: Record<WhatsappState, { label: string; tone: "success" | "error" | "neutral" }> = {
  open: { label: "Conectado", tone: "success" },
  connecting: { label: "Conectando…", tone: "neutral" },
  close: { label: "Desconectado", tone: "error" },
  unknown: { label: "Verificando…", tone: "neutral" },
}

interface QrData {
  qrcodeBase64: string
  pairingCode: string | null
}

export function ConnectionBadge({ state }: { state: WhatsappState }) {
  const meta = ESTADO_META[state]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClass[meta.tone],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full bg-current", state === "connecting" && "animate-pulse")}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  )
}

export function WhatsappConexaoRow() {
  const [expandido, setExpandido] = useState(false)
  const [carregandoQr, setCarregandoQr] = useState(false)
  const [qr, setQr] = useState<QrData | null>(null)
  const [expirado, setExpirado] = useState(false)
  const [confirmandoDesconexao, setConfirmandoDesconexao] = useState(false)
  const [desconectando, setDesconectando] = useState(false)
  const expiraTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data } = useInstanciaStatus(expandido)
  const state = data?.state ?? "unknown"

  useEffect(() => {
    return () => {
      if (expiraTimeoutRef.current) clearTimeout(expiraTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (expandido && data?.state === "open") {
      toast.success("WhatsApp conectado.")
      if (expiraTimeoutRef.current) clearTimeout(expiraTimeoutRef.current)
      setExpandido(false)
      setQr(null)
      setExpirado(false)
    }
  }, [data?.state, expandido])

  async function iniciarConexao() {
    setExpandido(true)
    setExpirado(false)
    setQr(null)
    setCarregandoQr(true)
    if (expiraTimeoutRef.current) clearTimeout(expiraTimeoutRef.current)

    try {
      const resposta = await fetch(WHATSAPP_CONECTAR_API_ROUTE, { method: "POST" })
      const resultado = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        toast.error(resultado.error ?? "Falha ao gerar o QR Code.")
        setExpandido(false)
        return
      }

      setQr({ qrcodeBase64: resultado.qrcodeBase64, pairingCode: resultado.pairingCode ?? null })
      expiraTimeoutRef.current = setTimeout(() => setExpirado(true), WHATSAPP_QR_TIMEOUT_MS)
    } catch {
      toast.error("Não foi possível conectar. Verifique sua internet e tente de novo.")
      setExpandido(false)
    } finally {
      setCarregandoQr(false)
    }
  }

  async function desconectar() {
    setDesconectando(true)
    try {
      const resposta = await fetch(WHATSAPP_DESCONECTAR_API_ROUTE, { method: "POST" })
      const resultado = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        toast.error(resultado.error ?? "Falha ao desconectar.")
        return
      }

      toast.success("WhatsApp desconectado.")
      setConfirmandoDesconexao(false)
      mutate(WHATSAPP_STATUS_API_ROUTE)
    } catch {
      toast.error("Não foi possível desconectar. Verifique sua internet e tente de novo.")
    } finally {
      setDesconectando(false)
    }
  }

  const botaoLabel = state === "close" ? "Reconectar" : "Conectar"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">Lavateria Fast</span>

        <div className="flex items-center gap-2">
          <ConnectionBadge state={state} />

          {!expandido ? (
            state === "open" ? (
              <AlertDialog open={confirmandoDesconexao} onOpenChange={setConfirmandoDesconexao}>
                <AlertDialogTrigger render={<Button variant="outline" size="xs" className="gap-1" />}>
                  Desconectar
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                    <AlertDialogDescription>
                      As duas unidades param de enviar lembretes por WhatsApp até que alguém escaneie um novo QR Code
                      para reconectar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={desconectando}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={desconectando}
                      onClick={desconectar}
                      className="gap-1.5"
                    >
                      {desconectando ? <Loader2 className="size-3.5 animate-spin" /> : null}
                      Desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button variant="outline" size="xs" className="gap-1" onClick={iniciarConexao}>
                <Smartphone className="size-3" />
                {botaoLabel}
              </Button>
            )
          ) : (
            <Button variant="ghost" size="xs" onClick={() => setExpandido(false)}>
              Fechar
            </Button>
          )}
        </div>
      </div>

      {expandido ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/20 p-4 text-center">
          {carregandoQr ? (
            <Skeleton className="size-44 rounded-lg" />
          ) : expirado ? (
            <div className="flex size-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">QR Code expirado</p>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={iniciarConexao}>
                <RefreshCw className="size-3.5" />
                Gerar novo QR Code
              </Button>
            </div>
          ) : qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr.qrcodeBase64}
              alt="QR Code para conectar o WhatsApp da Lavateria Fast"
              className="size-44 rounded-lg border border-border bg-white p-2"
            />
          ) : null}

          {!expirado ? (
            <div className="max-w-xs text-xs text-muted-foreground text-pretty">
              <p>
                Abra o WhatsApp no <strong className="text-foreground">único celular da Lavateria Fast</strong>{" "}
                (mesmo número das duas unidades) → Aparelhos conectados → Conectar um aparelho.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
