/** Formatação pt-BR centralizada (datas dd/mm/aaaa, números com separador BR). */

const numberFmt = new Intl.NumberFormat('pt-BR')
const percentFmt = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const currencyFmt = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})
const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function fmtNumero(n: number): string {
  return numberFmt.format(n)
}

export function fmtPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '—'
  return percentFmt.format(ratio)
}

export function fmtMoeda(n: number): string {
  return currencyFmt.format(n)
}

export function fmtData(iso: string | null): string {
  if (!iso) return '—'
  return dateFmt.format(new Date(iso))
}

export function fmtDataHora(iso: string | null): string {
  if (!iso) return '—'
  return dateTimeFmt.format(new Date(iso))
}

/** Rótulo curto de dia (ex: "seg 12/08") usado nos eixos dos gráficos. */
export function fmtDiaCurto(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}
