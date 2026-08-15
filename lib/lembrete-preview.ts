import { DIAS_SEMANA_LONGO } from "@/config/lembretes"

/**
 * Espelha substituirVariaveis() de supabase/functions/disparo-diario/index.ts
 * — mesmas variáveis, mesma lógica, só com valores fictícios de exemplo em
 * vez de dados reais do cliente. Se o catálogo real mudar lá, mudar aqui
 * também (config/lembretes.ts é a fonte da lista de variáveis nos dois lados).
 */
const NOME_EXEMPLO = "João"
const UNIDADE_EXEMPLO = "Cambeba"

export function renderizarPreview(
  template: string,
  ctx: { diasAposCompra: number; horario: string; diasSemana: number[] },
): string {
  const hoje = new Date()
  const dataStr = hoje.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  const diaRef = ctx.diasSemana[0] ?? hoje.getDay()

  return template
    .replaceAll("{{nome}}", NOME_EXEMPLO)
    .replaceAll("{{unidade}}", UNIDADE_EXEMPLO)
    .replaceAll("{{dias}}", String(ctx.diasAposCompra || "5"))
    .replaceAll("{{dia_semana}}", DIAS_SEMANA_LONGO[diaRef] ?? "")
    .replaceAll("{{hora}}", ctx.horario || "09:00")
    .replaceAll("{{data}}", dataStr)
}

/** Próxima ocorrência (dia+hora) entre os dias da semana configurados, a partir de agora. */
export function proximoDisparo(diasSemana: number[], horario: string): Date | null {
  if (diasSemana.length === 0) return null
  const [h, m] = horario.split(":").map(Number)
  const agora = new Date()

  for (let i = 0; i < 8; i++) {
    const candidato = new Date(agora)
    candidato.setDate(agora.getDate() + i)
    candidato.setHours(h ?? 9, m ?? 0, 0, 0)
    if (diasSemana.includes(candidato.getDay()) && candidato.getTime() > agora.getTime()) {
      return candidato
    }
  }
  return null
}

export function fmtProximoDisparo(diasSemana: number[], horario: string): string {
  const data = proximoDisparo(diasSemana, horario)
  if (!data) return "—"
  const diaSemana = DIAS_SEMANA_LONGO[data.getDay()]
  const hoje = new Date()
  const ehAmanha = data.getDate() === hoje.getDate() + 1 && data.getMonth() === hoje.getMonth()
  const ehHoje = data.toDateString() === hoje.toDateString()
  const prefixo = ehHoje ? "Hoje" : ehAmanha ? "Amanhã" : diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)
  const hora = `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`
  return `${prefixo}, ${hora}`
}
