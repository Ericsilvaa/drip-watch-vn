/**
 * Exportação CSV client-side (sem endpoint de backend).
 * Usada pelas tabelas de Envios recentes, Histórico de disparos e Importações.
 */

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value)
  return `"${str.replace(/"/g, '""')}"`
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(","))
  return lines.join("\n")
}

/** Gera e baixa o CSV no browser. Prefixo BOM (\uFEFF) evita acentos quebrados no Excel. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Nome de arquivo padronizado: `<secao>_AAAA-MM-DD.csv`. */
export function csvFilename(secao: string): string {
  return `${secao}_${new Date().toISOString().slice(0, 10)}.csv`
}
