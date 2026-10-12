import Plot from 'react-plotly.js'
import type { TickerInfo } from '@/types'
import { useUIStore } from '@/store/uiStore'

interface Props { info: TickerInfo }

const PERIOD_LABEL: Record<string, string> = {
  '0m': 'Current', '-1m': '-1 Month', '-2m': '-2 Months', '-3m': '-3 Months',
}

export function AnalystRecommendations({ info }: Props) {
  const { theme } = useUIStore()
  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const gridColor = isDark ? '#1E1E2E' : '#E5E7EB'

  const recs = info.recommendations
  if (!recs || recs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-40">
        <span className="text-muted text-sm">No recommendations data</span>
      </div>
    )
  }

  const periods = recs.map(r => PERIOD_LABEL[r.period] ?? r.period)
  const yMax = Math.max(...recs.map(r => r.strongBuy + r.buy + r.hold + r.sell + r.strongSell)) * 1.1

  const makeTrace = (
    key: keyof typeof recs[0],
    name: string,
    color: string,
  ) => ({
    type: 'bar' as const,
    name,
    x: periods,
    y: recs.map(r => r[key] as number),
    marker: { color },
    hovertemplate: `${name}: %{y}<extra></extra>`,
  })

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs font-semibold text-muted tracking-wide mb-1">Analyst Recommendations</p>
      <Plot
        data={[
          makeTrace('strongBuy', 'Strong Buy', '#16A34A'),
          makeTrace('buy', 'Buy', '#86EFAC'),
          makeTrace('hold', 'Hold', '#FCD34D'),
          makeTrace('sell', 'Sell', '#FCA5A5'),
          makeTrace('strongSell', 'Strong Sell', '#DC2626'),
        ]}
        layout={{
          barmode: 'stack',
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'SF Pro Display, -apple-system, sans-serif', color: fontColor, size: 11 },
          margin: { t: 8, b: 36, l: 32, r: 8 },
          height: 180,
          xaxis: { color: fontColor, showgrid: false },
          yaxis: { color: fontColor, gridcolor: gridColor, zeroline: false, range: [0, yMax*1.12] },
          legend: { orientation: 'h', y: -0.35, font: { size: 10 } },
          bargap: 0.4,
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%' }}
      />
    </div>
  )
}
