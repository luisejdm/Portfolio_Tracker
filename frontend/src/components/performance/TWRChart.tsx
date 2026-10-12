import Plot from 'react-plotly.js'
import { usePerformance } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { buildColoredSegments } from '@/lib/chartUtils'

const RANGES = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', 'MAX'] as const
type Range = typeof RANGES[number]

function filterByRange(points: { date: string; twr: string | null }[], range: Range) {
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

interface Props {
  range: Range
  onRangeChange: (r: Range) => void
}

export function TWRChart({ range, onRangeChange }: Props) {
  const { data, isLoading } = usePerformance()
  const { theme, accentColor } = useUIStore()

  if (isLoading) return <Skeleton className="h-72 rounded-xl" />
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl h-72 flex items-center justify-center text-muted text-sm">
        No TWR data yet
      </div>
    )
  }

  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const gridColor = isDark ? '#1E1E2E' : '#E5E7EB'

  const filtered = filterByRange(data, range).filter(p => p.twr !== null)
  const xs = filtered.map(p => p.date)
  const ys = filtered.map(p => parseFloat(p.twr!))
  const baseline = 0  // TWR: positive = gain, negative = loss
  const lastX = xs[xs.length - 1]
  const lastY = ys[ys.length - 1]
  const lastColor = lastY >= 0 ? '#22C55E' : '#EF4444'

  const absMin = Math.min(...ys)
  const absMax = Math.max(...ys)
  const yMin = absMin >= 0 ? absMin * 0.85 : absMin * 1.15
  const yMax = absMax >= 0 ? absMax * 1.15 : absMax * 0.85

  const traces = [
    ...buildColoredSegments(xs, ys, baseline, '#22C55E', '#EF4444',
      `%{x}<br><b>TWR: %{y:.2f}%</b><extra></extra>`),
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
        <p className="text-sm font-medium text-primary">Time-Weighted Return (%)</p>
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
          margin: { t: 8, b: 32, l: 56, r: 72 },
          xaxis: { gridcolor: gridColor, zerolinecolor: gridColor, showgrid: false },
          yaxis: { gridcolor: gridColor, zerolinecolor: gridColor, ticksuffix: '%', range: [yMin, yMax] },
          hovermode: 'x unified',
          shapes: [{
            type: 'line', x0: 0, x1: 1, xref: 'paper',
            y0: lastY, y1: lastY, yref: 'y',
            line: { color: lastColor, width: 1, dash: 'dash' },
          }],
          annotations: [{
            x: 1, xref: 'paper', y: lastY, yref: 'y',
            xanchor: 'left', yanchor: 'middle',
            text: `${lastY >= 0 ? '+' : ''}${lastY.toFixed(2)}%`,
            showarrow: false,
            bgcolor: lastColor,
            font: { color: 'white', size: 11, family: 'SF Pro Display, -apple-system, sans-serif' },
            borderpad: 4,
          }],
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '260px' }}
      />
    </div>
  )
}
