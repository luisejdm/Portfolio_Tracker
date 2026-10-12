import Plot from 'react-plotly.js'
import type { TickerInfo } from '@/types'
import { useUIStore } from '@/store/uiStore'

interface Props { info: TickerInfo }

const REC_LABEL: Record<string, string> = {
  strongBuy: 'Strong Buy', strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strongSell: 'Strong Sell', strong_sell: 'Strong Sell',
}
const REC_COLOR: Record<string, string> = {
  strongBuy: '#22C55E', strong_buy: '#22C55E',
  buy: '#86EFAC',
  hold: '#FCD34D',
  sell: '#FCA5A5',
  strongSell: '#EF4444', strong_sell: '#EF4444',
}

export function AnalystPriceTarget({ info }: Props) {
  const { theme, accentColor } = useUIStore()
  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const barColor = isDark ? '#374151' : '#D1D5DB'
  const endpointColor = isDark ? '#6B7280' : '#9CA3AF'

  const { targetLowPrice, targetMeanPrice, targetMedianPrice, targetHighPrice, currentPrice, numberOfAnalystOpinions, recommendationKey } = info

  if (!targetLowPrice || !targetHighPrice || !currentPrice) {
    return (
      <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-center h-40">
        <span className="text-muted text-sm">No analyst price target data</span>
      </div>
    )
  }

  const pad = (targetHighPrice - targetLowPrice) * 0.18
  const xMin = targetLowPrice - pad
  const xMax = targetHighPrice + pad

  const rec = recommendationKey ?? ''
  const recText = REC_LABEL[rec] ?? rec
  const recBadgeColor = REC_COLOR[rec] ?? accentColor

  // Traces are rendered in order — put the grey bar FIRST so markers draw on top of it.
  // Shapes always render behind all traces, so the bar must be a trace here.
  const traces = [
    // 1. Grey horizontal bar (trace, not shape — so markers render above it)
    {
      type: 'scatter' as const,
      mode: 'lines' as const,
      x: [targetLowPrice, targetHighPrice],
      y: [0, 0],
      line: { color: barColor, width: 5 },
      hoverinfo: 'skip' as const,
      showlegend: false,
    },
    // 2. Current vertical line (trace — rendered above grey bar, below markers)
    {
      type: 'scatter' as const,
      mode: 'lines' as const,
      name: `Current  $${currentPrice.toFixed(2)}`,
      x: [currentPrice, currentPrice],
      y: [-0.28, 0.28],
      line: { color: '#22C55E', width: 2 },
      hovertemplate: `Current: $${currentPrice.toFixed(2)}<extra></extra>`,
      showlegend: true,
    },
    // 3. Low / High grey endpoints (above bar)
    {
      type: 'scatter' as const,
      mode: 'markers' as const,
      x: [targetLowPrice, targetHighPrice],
      y: [0, 0],
      marker: { color: endpointColor, size: 10, line: { color: 'white', width: 1 } },
      text: [`Low: $${targetLowPrice.toFixed(2)}`, `High: $${targetHighPrice.toFixed(2)}`],
      hovertemplate: '%{text}<extra></extra>',
      showlegend: false,
    },
    // 4. Mean — rendered above endpoints
    ...(targetMeanPrice ? [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: `Mean  $${targetMeanPrice.toFixed(2)}`,
      x: [targetMeanPrice],
      y: [0],
      marker: { color: accentColor, size: 10, symbol: 'circle' as const, line: { color: 'white', width: 1.5 } },
      hovertemplate: `Mean: $${targetMeanPrice.toFixed(2)}<extra></extra>`,
      showlegend: true,
    }] : []),
    // 5. Median diamond — topmost
    ...(targetMedianPrice ? [{
      type: 'scatter' as const,
      mode: 'markers' as const,
      name: `Median  $${targetMedianPrice.toFixed(2)}`,
      x: [targetMedianPrice],
      y: [0],
      marker: { color: accentColor, size: 13, symbol: 'diamond' as const, line: { color: 'white', width: 1.5 } },
      hovertemplate: `Median: $${targetMedianPrice.toFixed(2)}<extra></extra>`,
      showlegend: true,
    }] : []),
  ]

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-muted tracking-wide">Analyst Price Targets</p>
        <div className="flex items-center gap-2">
          {rec && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: recBadgeColor + '33', color: recBadgeColor }}
            >
              {recText}
            </span>
          )}
          {numberOfAnalystOpinions != null && (
            <span className="text-xs text-muted">{numberOfAnalystOpinions} analysts</span>
          )}
        </div>
      </div>
      <Plot
        data={traces}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'SF Pro Display, -apple-system, sans-serif', color: fontColor, size: 11 },
          margin: { t: 8, b: 56, l: 12, r: 12 },
          height: 160,
          xaxis: {
            range: [xMin, xMax],
            showgrid: false,
            zeroline: false,
            showticklabels: false,
          },
          yaxis: {
            visible: false,
            range: [-0.6, 0.6],
          },
          legend: {
            orientation: 'h',
            y: -0.5,
            x: 0.5,
            xanchor: 'center',
            font: { size: 10 },
          },
          // Only Low and High price labels at the safe extremes — no risk of overlap
          annotations: [
            { x: targetLowPrice, y: -0.48, text: `$${targetLowPrice.toFixed(2)}`, showarrow: false, font: { size: 10, color: fontColor }, xanchor: 'center' },
            { x: targetHighPrice, y: -0.48, text: `$${targetHighPrice.toFixed(2)}`, showarrow: false, font: { size: 10, color: fontColor }, xanchor: 'center' },
          ],
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%' }}
      />
    </div>
  )
}
