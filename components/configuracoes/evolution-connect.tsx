"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { KeyRound, Loader2, Power, QrCode, RefreshCw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import {
  EVOLUTION_CONNECT_ROUTE,
  EVOLUTION_LOGOUT_ROUTE,
  EVOLUTION_STATUS_ROUTE,
} from "@/config/dashboard"
import type { EvolutionState, TipoInstanciaEvolution } from "@/lib/types"

const ROTULOS: Record<EvolutionState, { label: string; tone: string }> = {
  open: { label: "Conectado", tone: "text-status-success" },
  connecting: { label: "Aguardando o celular", tone: "text-status-warning" },
  close: { label: "Desconectado", tone: "text-status-error" },
  inexistente: { label: "Ainda não criada — será criada ao conectar", tone: "text-muted-foreground" },
  unknown: { label: "Desconhecido", tone: "text-muted-foreground" },
}

/** O QR do WhatsApp vence em ~40s: renova antes disso, por no máximo 5 minutos. */
const RENOVAR_QR_MS = 30_000
const MAX_RENOVACOES = 10
const STATUS_POLL_MS = 4_000

type Modo = "qr" | "codigo"

export function EvolutionConnect({ tipo }: { tipo: TipoInstanciaEvolution }) {
  const statusUrl = `${EVOLUTION_STATUS_ROUTE}?tipo=${tipo}`
  const connectUrl = `${EVOLUTION_CONNECT_ROUTE}?tipo=${tipo}`
  const logoutUrl = `${EVOLUTION_LOGOUT_ROUTE}?tipo=${tipo}`
  const [estado, setEstado] = useState<EvolutionState>("unknown")
  const [instancia, setInstancia] = useState<string | null>(null)
  const [numero, setNumero] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [pairing, setPairing] = useState<string | null>(null)
  const [modo, setModo] = useState<Modo>("qr")
  const [telefone, setTelefone] = useState("")
  const [carregando, setCarregando] = useState(true)
  const [conectando, setConectando] = useState(false)
  const [confirmarSaida, setConfirmarSaida] = useState(false)
  const [expirou, setExpirou] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const renovacoes = useRef(0)
  const estadoAnterior = useRef<EvolutionState>("unknown")

  const consultarStatus = useCallback(async () => {
    try {
      const res = await fetch(statusUrl, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) {
        setErro(data?.error ?? "Falha ao consultar status")
        setEstado("unknown")
        return
      }
      const novo = (data.state as EvolutionState) ?? "unknown"
      setErro(null)
      setEstado(novo)
      setInstancia(data.instance ?? null)
      setNumero(data.number ?? null)
      if (novo === "open") {
        if (estadoAnterior.current !== "open" && estadoAnterior.current !== "unknown") {
          toast.success("WhatsApp conectado")
        }
        setQr(null)
        setPairing(null)
        setExpirou(false)
      }
      estadoAnterior.current = novo
    } catch {
      setErro("Não foi possível contatar o servidor.")
      setEstado("unknown")
    } finally {
      setCarregando(false)
    }
  }, [statusUrl])

  const pedirConexao = useCallback(
    async (numeroPareamento?: string) => {
      const res = await fetch(connectUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(numeroPareamento ? { numero: numeroPareamento } : {}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Falha ao conectar")
      return data as { base64: string | null; pairingCode: string | null; state?: string }
    },
    [connectUrl],
  )

  useEffect(() => {
    consultarStatus()
  }, [consultarStatus])

  const aguardando = Boolean(qr || pairing) && estado !== "open"

  useEffect(() => {
    if (!aguardando) return
    const id = setInterval(consultarStatus, STATUS_POLL_MS)
    return () => clearInterval(id)
  }, [aguardando, consultarStatus])

  useEffect(() => {
    if (!qr || estado === "open") return
    const id = setTimeout(async () => {
      if (renovacoes.current >= MAX_RENOVACOES) {
        setQr(null)
        setExpirou(true)
        return
      }
      renovacoes.current += 1
      try {
        const data = await pedirConexao()
        if (data.base64) setQr(data.base64)
      } catch {
        setQr(null)
        setExpirou(true)
      }
    }, RENOVAR_QR_MS)
    return () => clearTimeout(id)
  }, [qr, estado, pedirConexao])

  async function conectar() {
    setConectando(true)
    setErro(null)
    setExpirou(false)
    renovacoes.current = 0
    try {
      const porCodigo = modo === "codigo"
      if (porCodigo && !telefone.trim()) {
        setErro("Digite o número com DDD para receber o código.")
        return
      }
      const data = await pedirConexao(porCodigo ? telefone : undefined)
      if (data.state === "open") {
        toast.message("Este WhatsApp já está conectado.")
        await consultarStatus()
        return
      }
      setQr(porCodigo ? null : data.base64)
      setPairing(porCodigo ? data.pairingCode : null)
      setEstado("connecting")
      if (porCodigo && !data.pairingCode) setErro("A Evolution não devolveu o código. Tente pelo QR Code.")
      if (!porCodigo && !data.base64) setErro("A Evolution não devolveu o QR Code. Tente de novo.")
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Falha ao conectar"
      setErro(mensagem)
      toast.error(mensagem)
    } finally {
      setConectando(false)
    }
  }

  async function desconectar() {
    setConectando(true)
    try {
      const res = await fetch(logoutUrl, { method: "POST" })
      const data = await res.json()
      if (!res.ok) toast.error(data?.error ?? "Falha ao desconectar")
      else {
        toast.success("Número desconectado")
        setQr(null)
        setPairing(null)
        setEstado("close")
      }
    } finally {
      setConectando(false)
      setConfirmarSaida(false)
      consultarStatus()
    }
  }

  const info = ROTULOS[estado]
  const conectado = estado === "open"
  const qrSrc = qr ? (qr.startsWith("data:") ? qr : `data:image/png;base64,${qr}`) : null

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
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
              {conectado && numero && <span className="font-mono text-muted-foreground">· {numero}</span>}
            </p>
          </div>
        </div>

        {!conectado && (
          <>
            <div className="mt-4 inline-flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Forma de conectar">
              {(
                [
                  ["qr", "QR Code", QrCode],
                  ["codigo", "Código por número", KeyRound],
                ] as const
              ).map(([valor, rotulo, Icone]) => (
                <button
                  key={valor}
                  type="button"
                  role="radio"
                  aria-checked={modo === valor}
                  onClick={() => setModo(valor)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    modo === valor ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icone className="size-3.5" />
                  {rotulo}
                </button>
              ))}
            </div>

            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              {modo === "qr" ? (
                <>
                  No celular do número que vai disparar, abra o WhatsApp em{" "}
                  <strong className="text-foreground">Aparelhos conectados → Conectar um aparelho</strong> e aponte a
                  câmera para o QR Code. Ele se renova sozinho enquanto você não lê.
                </>
              ) : (
                <>
                  Para quando o celular não está na sua frente: digite o número, gere o código e, no celular, toque em{" "}
                  <strong className="text-foreground">
                    Aparelhos conectados → Conectar um aparelho → Conectar com número de telefone
                  </strong>{" "}
                  e digite o código.
                </>
              )}
            </p>

            {modo === "codigo" && (
              <div className="mt-3 max-w-xs">
                <label htmlFor={`telefone-${tipo}`} className="text-xs font-medium text-foreground">
                  Número com DDD
                </label>
                <Input
                  id={`telefone-${tipo}`}
                  inputMode="tel"
                  placeholder="(85) 98956-1442"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </>
        )}

        {erro && (
          <p className="mt-3 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-2 text-sm text-status-error">
            {erro}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!conectado ? (
            <Button onClick={conectar} disabled={conectando}>
              {conectando ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : modo === "qr" ? (
                <QrCode data-icon="inline-start" />
              ) : (
                <KeyRound data-icon="inline-start" />
              )}
              {modo === "qr" ? (qr ? "Gerar novo QR" : "Conectar WhatsApp") : pairing ? "Gerar novo código" : "Gerar código"}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setConfirmarSaida(true)} disabled={conectando}>
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

      <div className="flex w-full shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/40 p-6 lg:w-72">
        {conectado ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-status-success/12 text-status-success">
              <Smartphone className="size-7" />
            </span>
            <p className="text-sm font-semibold text-foreground">WhatsApp conectado</p>
            {numero && <p className="font-mono text-xs text-muted-foreground">{numero}</p>}
            <p className="text-xs text-muted-foreground">Pronto para enviar disparos.</p>
          </div>
        ) : pairing ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <KeyRound className="size-8 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Digite no celular:</p>
            <code className="rounded-lg bg-background px-4 py-2 font-mono text-2xl font-semibold tracking-[0.2em] text-foreground">
              {pairing}
            </code>
            <p className="text-xs text-muted-foreground">Aguardando o celular...</p>
          </div>
        ) : qrSrc ? (
          <>
            {/* QR vindo da Evolution API (imagem base64) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="QR Code para conectar o WhatsApp" className="size-52 rounded-lg bg-white p-2" />
            <p className="text-center text-xs text-muted-foreground">Aguardando leitura... renova a cada 30s</p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <QrCode className="size-10 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {expirou ? (
                <>O QR expirou. Clique em <strong className="text-foreground">Conectar WhatsApp</strong> para gerar outro.</>
              ) : (
                <>
                  Clique em <strong className="text-foreground">Conectar WhatsApp</strong> para gerar o QR Code.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      <AlertDialog open={confirmarSaida} onOpenChange={(v) => !v && !conectando && setConfirmarSaida(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar este número?</AlertDialogTitle>
            <AlertDialogDescription>
              {tipo === "producao"
                ? "Os disparos para clientes param até outro número ser conectado. Use para trocar de número."
                : "Os disparos de teste param até outro número ser conectado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={conectando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={desconectar} disabled={conectando}>
              {conectando && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
