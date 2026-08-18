"use client"

import { useState } from "react"
import { Check, CheckCheck, ChevronLeft, MoreVertical, Phone, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import { aplicarExemplo, renderWhatsApp } from "@/lib/template-render"
import { dashboardConfig } from "@/config/dashboard"

type Device = "ios" | "android"

function horaAgora() {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date())
}

/** Bolha de mensagem enviada (verde), estilo WhatsApp. */
function Bolha({ corpo, device }: { corpo: string; device: Device }) {
  const texto = aplicarExemplo(corpo)
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "relative max-w-[80%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug text-[#111b21] shadow-sm",
          "bg-[#d9fdd3]",
          device === "ios" ? "rounded-br-sm" : "rounded-tr-sm",
        )}
      >
        <p className="whitespace-pre-wrap break-words pr-10">{renderWhatsApp(texto)}</p>
        <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[10px] text-[#667781]">
          {horaAgora()}
          <CheckCheck className="size-3 text-[#53bdeb]" />
        </span>
      </div>
    </div>
  )
}

/** Cabeçalho do chat, adaptado por sistema. */
function ChatHeader({ device }: { device: Device }) {
  const ios = device === "ios"
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 text-white",
        ios ? "h-16 bg-[#008069] pt-4" : "h-14 bg-[#075e54]",
      )}
    >
      <ChevronLeft className="size-5 shrink-0" />
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
        LF
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-semibold">{dashboardConfig.appBrand}</p>
        <p className="truncate text-[11px] text-white/80">online</p>
      </div>
      <Video className="size-5 shrink-0" />
      <Phone className="size-4 shrink-0" />
      {!ios && <MoreVertical className="size-5 shrink-0" />}
    </div>
  )
}

/** Moldura de celular com o chat dentro. */
function Telefone({ device, corpo }: { device: Device; corpo: string }) {
  const ios = device === "ios"
  return (
    <div
      className={cn(
        "relative mx-auto w-[280px] shrink-0 bg-[#111b21] p-2.5 shadow-xl",
        ios ? "rounded-[2.75rem]" : "rounded-[1.75rem]",
      )}
      aria-label={ios ? "Pré-visualização em iPhone" : "Pré-visualização em Android"}
    >
      {/* Notch / câmera */}
      {ios ? (
        <div className="absolute left-1/2 top-2.5 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#111b21]" />
      ) : (
        <div className="absolute left-1/2 top-4 z-10 size-2 -translate-x-1/2 rounded-full bg-black/60 ring-2 ring-white/10" />
      )}

      <div
        className={cn(
          "relative overflow-hidden bg-[#efeae2]",
          ios ? "rounded-[2.25rem]" : "rounded-[1.25rem]",
        )}
      >
        <ChatHeader device={device} />

        {/* Papel de parede do WhatsApp */}
        <div
          className="min-h-[360px] px-3 py-4"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage:
              "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)",
            backgroundSize: "22px 22px, 22px 22px",
            backgroundPosition: "0 0, 11px 11px",
          }}
        >
          <div className="mx-auto mb-3 w-fit rounded-md bg-[#fff5c4] px-2 py-1 text-[10px] text-[#54656f] shadow-sm">
            Hoje
          </div>
          <div className="flex flex-col gap-2">
            <Bolha corpo={corpo} device={device} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function WhatsAppPreview({ corpo }: { corpo: string }) {
  const [device, setDevice] = useState<Device>("ios")
  const vazio = !corpo.trim()

  return (
    <div className="flex flex-col gap-4">
      {/* Alternador de dispositivo */}
      <div className="inline-flex self-center rounded-full border border-border bg-secondary p-1">
        {(["ios", "android"] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
              device === d
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {d === "ios" ? "iPhone" : "Android"}
          </button>
        ))}
      </div>

      {vazio ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/40 px-6 text-center text-sm text-muted-foreground">
          Comece a escrever a mensagem para ver como ela aparecerá na conversa do WhatsApp.
        </div>
      ) : (
        <Telefone device={device} corpo={corpo} />
      )}

      <p className="text-center text-xs text-muted-foreground">
        Prévia com dados de exemplo. Placeholders como <code className="text-foreground">{"{{nome}}"}</code>{" "}
        são preenchidos no envio real. <Check className="inline size-3" /> = entregue.
      </p>
    </div>
  )
}
