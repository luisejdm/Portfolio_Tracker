import Plot from 'react-plotly.js'
import { usePerformance } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { buildColoredSegments } from '@/lib/chartUtils'

export const RANGES = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', 'MAX'] as const
export type Range = typeof RANGES[number]

interface Props {
  range: Range
  onRangeChange: (r: Range) => void
  height?: string
}

function filterByRange(points: { date: string; portfolio_value: string }[], range: Range) {
  if (range === 'MAX') return points
  const now = new Date()
  const cutoff = new Date(now)
  if (range === '1M') cutoff.setMonth(now.getMonth() - 1)
  else if (range === '3M') cutoff.setMonth(now.getMonth() - 3)
  else if (range === '6M') cutoff.setMonth(now.getMonth() - 6)
  else if (range === 'YTD') cutoff.setMonth(0, 1)
  else if (range === '1Y') cutoff.setFullYear(now.getFullYear() - 1)
  else if (range === '2Y') cutoff.setFullYear(now.getFullYear() - 2)
  return points.filter(p => new Date(p.date) >= cutoff)
}

export function PortfolioValueChart({ range, onRangeChange, height = '400px' }: Props) {
  const { data, isLoading } = usePerformance()
  const { theme, accentColor, displayCurrency } = useUIStore()

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl h-72 flex items-center justify-center text-muted text-sm">
        No performance data yet
      </div>
    )
  }

  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const gridColor = isDark ? '#1E1E2E' : '#E5E7EB'

  const filtered = filterByRange(data, range)
  const xs = filtered.map(p => p.date)
  const ys = filtered.map(p => parseFloat(p.portfolio_value))
  const baseline = ys[0] ?? 0
  const lastX = xs[xs.length - 1]
  const lastY = ys[ys.length - 1]
  const lastColor = lastY >= baseline ? accentColor : '#EF4444'

  const yMin = Math.min(...ys) * 0.85
  const yMax = Math.max(...ys) * 1.15

  const traces = [
    ...buildColoredSegments(xs, ys, baseline, accentColor, '#EF4444',
      `%{x}<br><b>%{y:,.2f}</b><extra></extra>`),
    // last point dot
    {
      type: 'scatter', mode: 'markers',
      x: [lastX], y: [lastY],
      marker: { color: lastColor, size: 7, line: { color: 'white', width: 1.5 } },
      showlegend: false, hoverinfo: 'skip',
    },
  ]

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-primary">Portfolio Value ({displayCurrency})</p>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => onRangeChange(r)}
              className={cn(
                'px-2 py-0.5 rounded text-xs transition-colors',
                range === r ? 'text-white font-medium' : 'text-muted hover:text-primary',
              )}
              style={range === r ? { backgroundColor: accentColor } : {}}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'SF Pro Display, -apple-system, sans-serif', color: fontColor },
          margin: { t: 8, b: 32, l: 64, r: 72 },
          xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, showgrid: false },
          yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, range: [yMin, yMax] },
          hovermode: 'x unified',
          shapes: [{
            type: 'line', x0: 0, x1: 1, xref: 'paper',
            y0: lastY, y1: lastY, yref: 'y',
            line: { color: lastColor, width: 1, dash: 'dash' },
          }],
          annotations: [{
            x: 1, xref: 'paper', y: lastY, yref: 'y',
            xanchor: 'left', yanchor: 'middle',
            text: lastY.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            showarrow: false,
            bgcolor: lastColor,
            font: { color: 'white', size: 11, family: 'SF Pro Display, -apple-system, sans-serif' },
            borderpad: 4,
          }],
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height }}
      />
    </div>
  )
}
