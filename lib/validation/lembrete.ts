import { LEMBRETE_VARIAVEIS } from "@/config/lembretes"
import type { Lembrete } from "@/lib/types"

/**
 * Validação compartilhada entre as rotas de Configuração de Disparos
 * (POST /api/config/lembretes e PATCH /api/config/lembretes/[id]).
 * Não fica dentro de um route.ts — Next.js só espera exports de método
 * HTTP (+ runtime/dynamic) ali.
 */
function variaveisInvalidas(texto: string): string[] {
  const usadas = texto.match(/\{\{[^}]*\}\}/g) ?? []
  const validas = new Set(LEMBRETE_VARIAVEIS.map((v) => v.chave))
  return [...new Set(usadas.filter((v) => !validas.has(v)))]
}

/** `parcial=true` (PATCH) permite campos ausentes — só valida os que vieram. */
export function validarLembrete(
  body: unknown,
  parcial = false,
): { erro: string } | { valor: Partial<Lembrete> } {
  const b = (body ?? {}) as Record<string, unknown>
  const valor: Partial<Lembrete> = {}

  if (!parcial || "nome" in b) {
    const nome = typeof b.nome === "string" ? b.nome.trim() : ""
    if (!nome) return { erro: "Nome do lembrete é obrigatório." }
    valor.nome = nome
  }

  if (!parcial || "horario" in b) {
    const horario = typeof b.horario === "string" ? b.horario : ""
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(horario)) return { erro: "Horário inválido." }
    valor.horario = horario
  }

  if (!parcial || "dias_semana" in b) {
    const dias_semana = Array.isArray(b.dias_semana) ? b.dias_semana.filter((d) => typeof d === "number") : []
    if (dias_semana.length === 0) return { erro: "Selecione ao menos um dia da semana." }
    if (dias_semana.some((d) => d < 0 || d > 6)) return { erro: "Dia da semana inválido." }
    valor.dias_semana = dias_semana
  }

  if (!parcial || "dias_apos_compra" in b) {
    const dias_apos_compra = Number(b.dias_apos_compra)
    if (!Number.isInteger(dias_apos_compra) || dias_apos_compra < 1) {
      return { erro: "Dias após a compra precisa ser um número inteiro maior que zero." }
    }
    valor.dias_apos_compra = dias_apos_compra
  }

  // Texto é opcional — o lembrete pode ser só imagem, só texto, ou os dois.
  // A obrigatoriedade real (pelo menos um dos dois) é checada no final,
  // depois que mensagem_template e imagem_url já foram processados.
  if (!parcial || "mensagem_template" in b) {
    const mensagem_template = typeof b.mensagem_template === "string" ? b.mensagem_template.trim() : ""
    if (mensagem_template) {
      const invalidas = variaveisInvalidas(mensagem_template)
      if (invalidas.length > 0) {
        return { erro: `Variável não suportada: ${invalidas.join(", ")}. Use apenas as do catálogo.` }
      }
    }
    valor.mensagem_template = mensagem_template || null
  }

  if (!parcial || "quantidade_max" in b) {
    let quantidade_max: number | null = null
    if (b.quantidade_max !== null && b.quantidade_max !== undefined && b.quantidade_max !== "") {
      quantidade_max = Number(b.quantidade_max)
      if (!Number.isInteger(quantidade_max) || quantidade_max < 1) {
        return { erro: "Quantidade de envios precisa ser um número inteiro maior que zero." }
      }
    }
    valor.quantidade_max = quantidade_max
  }

  if (!parcial || "unidade_id" in b) {
    valor.unidade_id = typeof b.unidade_id === "string" && b.unidade_id ? b.unidade_id : null
  }
  if (!parcial || "imagem_url" in b) {
    valor.imagem_url = typeof b.imagem_url === "string" && b.imagem_url ? b.imagem_url : null
  }
  if (!parcial || "ativo" in b) {
    valor.ativo = typeof b.ativo === "boolean" ? b.ativo : true
  }

  // Checagem cruzada: só faz sentido na criação (!parcial) — um PATCH parcial
  // não necessariamente manda os dois campos juntos, e não temos a linha
  // atual aqui pra saber se o campo ausente já está preenchido no banco.
  if (!parcial && !valor.mensagem_template && !valor.imagem_url) {
    return { erro: "O lembrete precisa ter texto, imagem, ou os dois — não pode ficar vazio." }
  }

  return { valor }
}
