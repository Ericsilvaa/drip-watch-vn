"use client"

import { useId } from "react"

/**
 * Mini-gráfico de tendência (7 dias). SVG leve, sem dependência de chart lib —
 * é informação de apoio nos KPIs, não decoração.
 */
export function Sparkline({
  data,
  color = "var(--color-primary)",
  className,
}: {
  data: number[]
  color?: string
  className?: string
}) {
  const width = 96
  const height = 32
  const pad = 2
  const gradId = useId()

  if (!data.length || data.every((d) => d === 0)) {
    return (
      <svg width={width} height={height} className={className} aria-hidden="true">
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="var(--color-border)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
      </svg>
    )
  }

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1 || 1)

  const points = data.map((d, i) => {
    const x = pad + i * stepX
    const y = height - pad - ((d - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`

  return (
    <svg width={width} height={height} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
