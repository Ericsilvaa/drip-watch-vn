import type { ReactNode } from "react"

/**
 * Ponte entre o texto puro com marcadores do WhatsApp (o que fica salvo em
 * mensagem_template e o que a Evolution API realmente recebe) e o editor
 * rich-text (Tiptap). Único ponto de verdade da conversão — o editor e o
 * preview usam as mesmas funções, então nunca desalinham.
 *
 * Marcadores reais do WhatsApp (não é markdown padrão — asterisco simples
 * pra negrito, não duplo; crase tripla pra monoespaçado, não simples):
 *   *negrito*  _itálico_  ~riscado~  ```monoespaçado```
 */

export interface MarkupSegment {
  text: string
  bold?: boolean
  italic?: boolean
  strike?: boolean
  code?: boolean
}

/** Extrai blocos ```monoespaçado``` primeiro (não combina com outra formatação,
 * igual ao comportamento real do WhatsApp), depois faz parse de negrito/
 * itálico/riscado como marcadores que alternam (liga/desliga), permitindo
 * combinações como *_negrito e itálico juntos_*. */
export function parseWhatsappMarkup(texto: string): MarkupSegment[] {
  const segmentos: MarkupSegment[] = []
  const partes = texto.split(/(```[^`]*?```)/g)

  for (const parte of partes) {
    if (!parte) continue
    if (parte.startsWith("```") && parte.endsWith("```") && parte.length >= 6) {
      const interno = parte.slice(3, -3)
      if (interno) segmentos.push({ text: interno, code: true })
      continue
    }
    segmentos.push(...parseTogglesEmTrecho(parte))
  }
  return segmentos
}

function parseTogglesEmTrecho(trecho: string): MarkupSegment[] {
  const segmentos: MarkupSegment[] = []
  let bold = false
  let italic = false
  let strike = false
  let buffer = ""

  const flush = () => {
    if (buffer) segmentos.push({ text: buffer, bold: bold || undefined, italic: italic || undefined, strike: strike || undefined })
    buffer = ""
  }

  for (const c of trecho) {
    if (c === "*" || c === "_" || c === "~") {
      flush()
      if (c === "*") bold = !bold
      if (c === "_") italic = !italic
      if (c === "~") strike = !strike
      continue
    }
    buffer += c
  }
  flush()
  return segmentos
}

/** Converte texto com marcadores WhatsApp em JSON inicial pro Tiptap (usado ao abrir um lembrete pra editar). */
export function whatsappMarkupParaTiptapJSON(texto: string) {
  const segmentos = parseWhatsappMarkup(texto)
  const conteudo: Record<string, unknown>[] = []

  for (const seg of segmentos) {
    const linhas = seg.text.split("\n")
    linhas.forEach((linha, idx) => {
      if (idx > 0) conteudo.push({ type: "hardBreak" })
      if (!linha) return
      const marks: { type: string }[] = []
      if (seg.code) marks.push({ type: "code" })
      else {
        if (seg.bold) marks.push({ type: "bold" })
        if (seg.italic) marks.push({ type: "italic" })
        if (seg.strike) marks.push({ type: "strike" })
      }
      conteudo.push({ type: "text", text: linha, ...(marks.length ? { marks } : {}) })
    })
  }

  return {
    type: "doc",
    content: [{ type: "paragraph", ...(conteudo.length ? { content: conteudo } : {}) }],
  }
}

export interface TiptapTextNode {
  type: string
  text?: string
  marks?: { type: string }[]
  content?: TiptapTextNode[]
}

/** Converte o JSON do Tiptap de volta pro texto com marcadores WhatsApp (usado ao salvar). */
export function tiptapJSONParaWhatsappMarkup(doc: { content?: TiptapTextNode[] }): string {
  const paragrafos = doc.content ?? []
  const partes: string[] = []

  for (const paragrafo of paragrafos) {
    let saida = ""
    for (const filho of paragrafo.content ?? []) {
      if (filho.type === "hardBreak") {
        saida += "\n"
        continue
      }
      if (filho.type === "text" && filho.text) {
        const tipos = (filho.marks ?? []).map((m) => m.type)
        if (tipos.includes("code")) {
          saida += "```" + filho.text + "```"
          continue
        }
        let t = filho.text
        if (tipos.includes("bold")) t = `*${t}*`
        if (tipos.includes("italic")) t = `_${t}_`
        if (tipos.includes("strike")) t = `~${t}~`
        saida += t
      }
    }
    partes.push(saida)
  }

  return partes.join("\n\n")
}

/** Renderiza texto com marcadores WhatsApp como JSX estilizado — usado só no
 * preview (fora do editor), pra mostrar como a mensagem chega no cliente. */
export function renderizarWhatsappMarkup(texto: string): ReactNode {
  const segmentos = parseWhatsappMarkup(texto)
  return segmentos.map((seg, i) => {
    if (seg.code) {
      return (
        <code key={i} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.9em]">
          {seg.text}
        </code>
      )
    }
    let node: ReactNode = seg.text
    if (seg.strike) node = <s>{node}</s>
    if (seg.italic) node = <em>{node}</em>
    if (seg.bold) node = <strong>{node}</strong>
    return <span key={i}>{node}</span>
  })
}
