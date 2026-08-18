"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Power, QrCode, RefreshCw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  EVOLUTION_CONNECT_ROUTE,
  EVOLUTION_LOGOUT_ROUTE,
  EVOLUTION_STATUS_ROUTE,
} from "@/config/dashboard"
import type { EvolutionState } from "@/lib/types"

const ROTULOS: Record<EvolutionState, { label: string; tone: string }> = {
  open: { label: "Conectado", tone: "text-status-success" },
  connecting: { label: "Conectando", tone: "text-status-warning" },
  close: { label: "Desconectado", tone: "text-status-error" },
  unknown: { label: "Desconhecido", tone: "text-muted-foreground" },
}

export function EvolutionConnect() {
  const [estado, setEstado] = useState<EvolutionState>("unknown")
  const [instancia, setInstancia] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [pairing, setPairing] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const consultarStatus = useCallback(async () => {
    try {
      const res = await fetch(EVOLUTION_STATUS_ROUTE, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? "Falha ao consultar status")
        setEstado("unknown")
      } else {
        setErro(null)
        setEstado((data.state as EvolutionState) ?? "unknown")
        setInstancia(data.instance ?? null)
        if (data.state === "open") setQr(null)
      }
    } catch {
      setErro("Não foi possível contatar o servidor Evolution.")
      setEstado("unknown")
    } finally {
      setCarregando(false)
    }
  }, [])

  // status inicial
  useEffect(() => {
    consultarStatus()
  }, [consultarStatus])

  // enquanto há QR / conectando, faz polling até abrir
  useEffect(() => {
    if (estado === "open") {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }
    if (qr && !pollRef.current) {
      pollRef.current = setInterval(consultarStatus, 4000)
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [qr, estado, consultarStatus])

  async function gerarQr() {
    setConectando(true)
    setErro(null)
    try {
      const res = await fetch(EVOLUTION_CONNECT_ROUTE, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? "Falha ao gerar QR Code")
        toast.error(data?.error ?? "Falha ao gerar QR Code")
      } else {
        setQr(data.base64 ?? null)
        setPairing(data.pairingCode ?? null)
        setEstado("connecting")
        if (!data.base64 && !data.pairingCode) {
          toast.message("Nenhum QR retornado — a instância pode já estar conectada.")
          consultarStatus()
        }
      }
    } catch {
      setErro("Não foi possível contatar o servidor Evolution.")
    } finally {
      setConectando(false)
    }
  }

  async function desconectar() {
    setConectando(true)
    try {
      const res = await fetch(EVOLUTION_LOGOUT_ROUTE, { method: "POST" })
      const data = await res.json()
      if (!res.ok) toast.error(data?.error ?? "Falha ao desconectar")
      else {
        toast.success("Instância desconectada")
        setQr(null)
        setPairing(null)
        setEstado("close")
      }
    } finally {
      setConectando(false)
      consultarStatus()
    }
  }

  const info = ROTULOS[estado]
  const conectado = estado === "open"

  const qrSrc = qr ? (qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`) : null

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {/* Status */}
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              conectado ? "bg-status-success/12 text-status-success" : "bg-secondary text-muted-foreground",
            )}
          >
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Instância {instancia ? <code className="font-mono">{instancia}</code> : "WhatsApp"}
            </p>
            <p className={cn("flex items-center gap-1.5 text-sm font-medium", info.tone)}>
              <span
                className={cn(
                  "size-2 rounded-full",
                  conectado ? "bg-status-success" : estado === "connecting" ? "bg-status-warning" : "bg-status-error",
                )}
              />
              {carregando ? "Verificando..." : info.label}
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Conecte o número de WhatsApp que fará os disparos. Abra o WhatsApp no celular, vá em{" "}
          <strong className="text-foreground">Aparelhos conectados → Conectar um aparelho</strong> e aponte a
          câmera para o QR Code.
        </p>

        {erro && (
          <p className="mt-3 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
            {erro}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!conectado ? (
            <Button onClick={gerarQr} disabled={conectando}>
              {conectando ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <QrCode data-icon="inline-start" />
              )}
              {qr ? "Gerar novo QR" : "Conectar WhatsApp"}
            </Button>
          ) : (
            <Button variant="outline" onClick={desconectar} disabled={conectando}>
              <Power data-icon="inline-start" />
              Desconectar
            </Button>
          )}
          <Button variant="ghost" onClick={consultarStatus} disabled={carregando}>
            <RefreshCw data-icon="inline-start" className={cn(carregando && "animate-spin")} />
            Atualizar status
          </Button>
        </div>
      </div>

      {/* QR */}
      <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/40 p-6 lg:w-72">
        {conectado ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-status-success/12 text-status-success">
              <Smartphone className="size-7" />
            </span>
            <p className="text-sm font-semibold text-foreground">WhatsApp conectado</p>
            <p className="text-xs text-muted-foreground">Pronto para enviar disparos.</p>
          </div>
        ) : qrSrc ? (
          <>
            {/* QR vindo da Evolution API (imagem base64) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc || "/placeholder.svg"}
              alt="QR Code para conectar o WhatsApp"
              className="size-52 rounded-lg bg-white p-2"
            />
            {pairing && (
              <p className="text-center text-xs text-muted-foreground">
                Ou use o código: <code className="font-mono font-semibold text-foreground">{pairing}</code>
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">Aguardando leitura...</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <QrCode className="size-10 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Clique em <strong className="text-foreground">Conectar WhatsApp</strong> para gerar o QR Code.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
