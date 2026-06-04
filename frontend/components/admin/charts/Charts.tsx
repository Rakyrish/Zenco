// ─── Pure SVG Chart Components — No external chart library needed ─────────

// ── LineChart ─────────────────────────────────────────────────────────────
interface LineChartProps {
  data: { date: string; value: number }[]
  color?: string
  height?: number
  showDots?: boolean
  fillOpacity?: number
  label?: string
}

export function LineChart({ data, color = '#F26C0C', height = 120, showDots = true, fillOpacity = 0.12, label }: LineChartProps) {
  if (!data.length) return null
  const W = 500; const H = height
  const vals = data.map(d => d.value)
  const min = Math.min(...vals); const max = Math.max(...vals)
  const range = max - min || 1
  const pad = { t: 8, b: 20, l: 4, r: 4 }
  const cW = W - pad.l - pad.r; const cH = H - pad.t - pad.b

  const x = (i: number) => pad.l + (i / (data.length - 1)) * cW
  const y = (v: number) => pad.t + cH - ((v - min) / range) * cH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(data.length - 1)},${H - pad.b} L ${x(0)},${H - pad.b} Z`

  return (
    <div>
      {label && <p className="text-xs text-gray-400 mb-1">{label}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={fillOpacity * 4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {showDots && data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill="white" stroke={color} strokeWidth="2" />
        ))}
        {/* X-axis labels (every ~5 points) */}
        {data.map((d, i) => {
          if (data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) {
            return (
              <text key={i} x={x(i)} y={H - 2} textAnchor="middle" fontSize="8" fill="#9CA3AF">
                {d.date.slice(5)}
              </text>
            )
          }
          return null
        })}
      </svg>
    </div>
  )
}

// ── BarChart ──────────────────────────────────────────────────────────────
interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  color?: string
  height?: number
  horizontal?: boolean
}

export function BarChart({ data, color = '#0C094D', height = 160, horizontal = false }: BarChartProps) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.value)) || 1

  if (horizontal) {
    return (
      <div className="space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 w-40 truncate shrink-0 text-right">{d.label}</span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
                style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }}
              >
                <span className="text-[10px] font-bold text-white">{d.value.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const W = 500; const H = height
  const pad = { t: 8, b: 24, l: 4, r: 4 }
  const cW = W - pad.l - pad.r; const cH = H - pad.t - pad.b
  const barW = Math.max(8, cW / data.length - 6)
  const gap = (cW - barW * data.length) / (data.length + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const bH = (d.value / max) * cH
        const bX = pad.l + gap + i * (barW + gap)
        const bY = pad.t + cH - bH
        return (
          <g key={i}>
            <rect x={bX} y={bY} width={barW} height={bH} fill={d.color || color} rx="4" opacity="0.9" />
            <text x={bX + barW / 2} y={H - 6} textAnchor="middle" fontSize="8" fill="#9CA3AF">
              {d.label.slice(0, 6)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ── DonutChart ────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string | number
}

export function DonutChart({ data, size = 140, thickness = 28, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2; const cy = size / 2
  const circumference = 2 * Math.PI * r

  let offset = -Math.PI / 2
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(offset)
    const y1 = cy + r * Math.sin(offset)
    offset += angle
    const x2 = cx + r * Math.cos(offset)
    const y2 = cy + r * Math.sin(offset)
    const large = angle > Math.PI ? 1 : 0
    return { ...d, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, angle }
  })

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity="0.9" className="transition-opacity hover:opacity-100" />
        ))}
        <circle cx={cx} cy={cy} r={r - thickness / 2} fill="currentColor" className="text-white dark:text-gray-900" />
        {centerValue !== undefined && (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="bold" fill="currentColor" className="fill-gray-800 dark:fill-white">
              {centerValue}
            </text>
            {centerLabel && (
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#9CA3AF">{centerLabel}</text>
            )}
          </>
        )}
      </svg>
      <div className="space-y-1.5 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{d.label}</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 ml-auto tabular-nums">{((d.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MiniSparkline ─────────────────────────────────────────────────────────
interface MiniSparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
}

export function MiniSparkline({ data, color = '#F26C0C', width = 80, height = 30 }: MiniSparklineProps) {
  if (data.length < 2) return null
  const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1
  const x = (i: number) => (i / (data.length - 1)) * width
  const y = (v: number) => height - ((v - min) / range) * (height - 2) - 1
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)},${y(v)}`).join(' ')
  return (
    <svg width={width} height={height}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  )
}
