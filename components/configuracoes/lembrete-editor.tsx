"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, Strikethrough, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { whatsappMarkupParaTiptapJSON, tiptapJSONParaWhatsappMarkup, type TiptapTextNode } from "@/lib/whatsapp-markup"
import { LEMBRETE_VARIAVEIS } from "@/config/lembretes"

/**
 * Editor rich-text pro texto do lembrete — WYSIWYG de negrito/itálico/
 * riscado/monoespaçado, mas o que sai (onChange) é sempre texto puro com
 * os marcadores reais do WhatsApp (*negrito*, _itálico_, ~riscado~,
 * ```mono```), nunca HTML/markdown padrão. lib/whatsapp-markup.tsx é o
 * único lugar que sabe converter os dois sentidos — editor e preview
 * (renderizarWhatsappMarkup) usam as mesmas funções, nunca desalinham.
 *
 * StarterKit vem com nós que não fazem sentido pra uma mensagem de
 * WhatsApp (heading, lista, blockquote, code block de bloco, hr) —
 * desligados abaixo. Só parágrafo + quebra de linha + as 4 marcas.
 */
export function LembreteEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (novoValor: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
    ],
    content: whatsappMarkupParaTiptapJSON(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[110px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_p]:leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(tiptapJSONParaWhatsappMarkup(editor.getJSON() as unknown as { content?: TiptapTextNode[] }))
    },
  })

  // Sincroniza quando `value` muda por fora (ex: trocar de lembrete pra
  // editar) — sem loop, só quando o texto convertido de volta é diferente
  // do que o editor já tem (evita resetar o cursor a cada tecla digitada).
  useEffect(() => {
    if (!editor) return
    const atual = tiptapJSONParaWhatsappMarkup(editor.getJSON() as unknown as { content?: TiptapTextNode[] })
    if (atual !== value) {
      editor.commands.setContent(whatsappMarkupParaTiptapJSON(value))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  const botoesFormatacao = [
    { icone: Bold, ativo: editor.isActive("bold"), acao: () => editor.chain().focus().toggleBold().run(), titulo: "Negrito" },
    { icone: Italic, ativo: editor.isActive("italic"), acao: () => editor.chain().focus().toggleItalic().run(), titulo: "Itálico" },
    { icone: Strikethrough, ativo: editor.isActive("strike"), acao: () => editor.chain().focus().toggleStrike().run(), titulo: "Riscado" },
    { icone: Code, ativo: editor.isActive("code"), acao: () => editor.chain().focus().toggleCode().run(), titulo: "Monoespaçado" },
  ]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {botoesFormatacao.map(({ icone: Icone, ativo, acao, titulo }) => (
          <Button
            key={titulo}
            type="button"
            variant="ghost"
            size="icon-sm"
            title={titulo}
            aria-pressed={ativo}
            onClick={acao}
            className={cn(ativo && "bg-highlight-bg text-primary")}
          >
            <Icone className="size-3.5" />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <div className="flex flex-wrap gap-1.5">
        {LEMBRETE_VARIAVEIS.map((v) => (
          <button
            key={v.chave}
            type="button"
            title={v.descricao}
            onClick={() => editor.chain().focus().insertContent(v.chave).run()}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-highlight-bg"
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  )
}
