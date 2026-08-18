import type { ReactNode } from "react"
import { PREVIEW_EXEMPLO } from "@/config/dashboard"

/** Substitui {{placeholders}} pelos valores de exemplo do preview. */
export function aplicarExemplo(corpo: string): string {
  return corpo.replace(/\{\{\s*[\w]+\s*\}\}/g, (m) => {
    const chave = m.replace(/\s/g, "")
    return PREVIEW_EXEMPLO[chave] ?? m
  })
}

/**
 * Renderiza formatação básica do WhatsApp: *negrito*, _itálico_, ~tachado~,
 * e quebras de linha. Retorna nós React seguros (sem dangerouslySetInnerHTML).
 */
export function renderWhatsApp(texto: string): ReactNode[] {
  const linhas = texto.split("\n")
  return linhas.map((linha, i) => (
    <span key={i}>
      {formatarInline(linha)}
      {i < linhas.length - 1 && <br />}
    </span>
  ))
}

function formatarInline(linha: string): ReactNode[] {
  // Ordem: negrito *..*, itálico _.._, tachado ~..~
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g
  const partes = linha.split(regex).filter((p) => p !== "")
  return partes.map((parte, i) => {
    if (/^\*[^*\n]+\*$/.test(parte)) {
      return <strong key={i}>{parte.slice(1, -1)}</strong>
    }
    if (/^_[^_\n]+_$/.test(parte)) {
      return <em key={i}>{parte.slice(1, -1)}</em>
    }
    if (/^~[^~\n]+~$/.test(parte)) {
      return <s key={i}>{parte.slice(1, -1)}</s>
    }
    return <span key={i}>{parte}</span>
  })
}

/** Conta caracteres do corpo com placeholders resolvidos (aproxima o envio real). */
export function contarCaracteres(corpo: string): number {
  return aplicarExemplo(corpo).length
}
