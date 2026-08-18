'use client'

/**
 * Estado global dos filtros do cabeçalho: período, unidade e "incluir grupo de
 * teste". Vive num contexto para que todos os componentes/hooks reajam à mesma
 * seleção sem prop drilling.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  ITENS_POR_PAGINA,
  PERIODO_PADRAO,
  type PeriodoKey,
  type UnidadeSlug,
} from '@/config/dashboard'

interface CustomRange {
  from: string // yyyy-mm-dd
  to: string
}

interface FiltersState {
  periodo: PeriodoKey
  setPeriodo: (p: PeriodoKey) => void
  customRange: CustomRange
  setCustomRange: (r: CustomRange) => void
  unidade: UnidadeSlug
  setUnidade: (u: UnidadeSlug) => void
  incluirGrupoTeste: boolean
  setIncluirGrupoTeste: (v: boolean) => void
  itensPorPagina: number
  /** Início do período selecionado (Date). Fim é sempre "agora". */
  inicioPeriodo: Date
  fimPeriodo: Date
}

const FiltersContext = createContext<FiltersState | null>(null)

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardFiltersProvider({ children }: { children: ReactNode }) {
  const [periodo, setPeriodo] = useState<PeriodoKey>(PERIODO_PADRAO)
  const [unidade, setUnidade] = useState<UnidadeSlug>('todas')
  const [incluirGrupoTeste, setIncluirGrupoTeste] = useState(false)
  const [customRange, setCustomRange] = useState<CustomRange>({
    from: hoje(),
    to: hoje(),
  })

  const { inicioPeriodo, fimPeriodo } = useMemo(() => {
    const fim = new Date()
    fim.setHours(23, 59, 59, 999)
    let inicio = new Date()

    if (periodo === 'hoje') {
      inicio.setHours(0, 0, 0, 0)
    } else if (periodo === '7d') {
      inicio.setDate(inicio.getDate() - 6)
      inicio.setHours(0, 0, 0, 0)
    } else if (periodo === '30d') {
      inicio.setDate(inicio.getDate() - 29)
      inicio.setHours(0, 0, 0, 0)
    } else {
      inicio = new Date(customRange.from + 'T00:00:00')
      return {
        inicioPeriodo: inicio,
        fimPeriodo: new Date(customRange.to + 'T23:59:59'),
      }
    }
    return { inicioPeriodo: inicio, fimPeriodo: fim }
  }, [periodo, customRange])

  const value: FiltersState = {
    periodo,
    setPeriodo,
    customRange,
    setCustomRange,
    unidade,
    setUnidade,
    incluirGrupoTeste,
    setIncluirGrupoTeste,
    itensPorPagina: ITENS_POR_PAGINA,
    inicioPeriodo,
    fimPeriodo,
  }

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
}

export function useDashboardFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) {
    throw new Error(
      'useDashboardFilters deve ser usado dentro de <DashboardFiltersProvider>',
    )
  }
  return ctx
}
