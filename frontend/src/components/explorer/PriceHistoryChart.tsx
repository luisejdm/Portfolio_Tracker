import { useState } from 'react'
import Plot from 'react-plotly.js'
import { useTickerHistory, useTickerPrice } from '@/hooks/useMarketData'
import { useUIStore } from '@/store/uiStore'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatPct, pnlColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { buildColoredSegments } from '@/lib/chartUtils'
import type { TickerInfo } from '@/types'

const RANGES = ['1w', '1m', '3m', '6m', 'ytd', '1y', '2y', '5y', 'max'] as const
type Range = typeof RANGES[number]
type ChartType = 'line' | 'candlestick'

interface Props { ticker: string; info?: TickerInfo | null }

export function PriceHistoryChart({ ticker, info }: Props) {
  const [range, setRange] = useState<Range>('1y')
  const [chartType, setChartType] = useState<ChartType>('line')

  const { data, isLoading } = useTickerHistory(ticker, range)
  const { data: priceData } = useTickerPrice(ticker)
  const { theme, accentColor } = useUIStore()

  const isDark = theme === 'dark'
  const fontColor = isDark ? '#F0F0F5' : '#111827'
  const gridColor = isDark ? '#1E1E2E' : '#E5E7EB'
  const currency = ticker.endsWith('.MX') ? 'MXN' : 'USD'

  const xs = data?.map(p => p.date) ?? []
  const closes = data?.map(p => parseFloat(p.close)) ?? []
  const opens = data?.map(p => parseFloat(p.open)) ?? []
  const volumes = data?.map(p => p.volume) ?? []
  const baseline = closes[0] ?? 0
  const lastX = xs[xs.length - 1]
  const lastY = closes[closes.length - 1]
  const lastColor = lastY >= baseline ? accentColor : '#EF4444'
  const periodReturn = baseline > 0 ? (lastY / baseline - 1) * 100 : null

  const lineYMin = closes.length ? Math.min(...closes) * 0.95 : undefined
  const lineYMax = closes.length ? Math.max(...closes) * 1.05 : undefined

  const volumeColors = closes.map((c, i) =>
    c >= (opens[i] ?? c) ? '#22C55E60' : '#EF444460'
  )

  const volumeTrace = {
    type: 'bar',
    x: xs,
    y: volumes,
    yaxis: 'y2',
    marker: { color: volumeColors },
    showlegend: false,
    hovertemplate: '%{x}<br>Vol: %{y:,.0f}<extra></extra>',
  }

  const traceData = chartType === 'candlestick'
    ? [
        { type: 'candlestick' as const, x: xs,
          open: opens, high: data?.map(p => parseFloat(p.high)) ?? [],
          low: data?.map(p => parseFloat(p.low)) ?? [], close: closes,
          increasing: { line: { color: '#22C55E' } },
          decreasing: { line: { color: '#EF4444' } },
        },
        volumeTrace,
      ]
    : [
        ...buildColoredSegments(xs, closes, baseline, accentColor, '#EF4444',
          `%{x}<br><b>%{y:,.2f}</b><extra></extra>`),
        { type: 'scatter', mode: 'markers',
          x: [lastX], y: [lastY],
          marker: { color: lastColor, size: 7, line: { color: 'white', width: 1.5 } },
          showlegend: false, hoverinfo: 'skip',
        },
        volumeTrace,
      ]

  const logoToken = import.meta.env.VITE_LOGO_DEV_TOKEN as string | undefined
  const logoDomain = (() => {
    if (!info?.website) return null
    try { return new URL(info.website).hostname.replace(/^www\./, '') }
    catch { return null }
  })()
  const logoUrl = logoToken && logoDomain
    ? `https://img.logo.dev/${logoDomain}?token=${logoToken}`
    : null

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {/* Logo + top 2 rows: ticker/name and sector/industry */}
          <div className="flex items-center gap-3">
            {logoUrl && (
              <div
                className="w-10 h-10 rounded-lg overflow-hidden shrink-0"
                style={isDark ? { backgroundColor: 'white', padding: '1px' } : { border: '1px solid var(--border)', padding: '1px' }}
              >
                <img
                  src={logoUrl}
                  alt=""
                  className="w-full h-full object-contain block"
                  onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-semibold text-primary text-lg">{ticker}</span>
                {info?.shortName && (
                  <span className="text-sm text-muted">{info.shortName}</span>
                )}
              </div>
              {(info?.sector || info?.industry || info?.fullExchangeName) && (
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {info.sector && <span className="text-xs text-muted">{info.sector}</span>}
                  {info.sector && info.industry && <span className="text-xs text-muted">·</span>}
                  {info.industry && <span className="text-xs text-muted">{info.industry}</span>}
                  {(info.sector || info.industry) && info.fullExchangeName && <span className="text-xs text-muted">·</span>}
                  {info.fullExchangeName && <span className="text-xs text-muted">{info.fullExchangeName}</span>}
                </div>
              )}
            </div>
          </div>
          {/* Price + return: below, left-aligned with logo */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {priceData && (
              <span className="text-muted text-sm tabular-nums">
                {formatCurrency(priceData.price, currency)}
                {priceData.stale && <span className="ml-1 text-yellow-500 text-xs">stale</span>}
              </span>
            )}
            {periodReturn !== null && (
              <span className={`text-sm font-medium tabular-nums ${pnlColor(periodReturn)}`}>
                {formatPct(periodReturn)} <span className="text-xs font-normal uppercase opacity-70">{range}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden border border-border">
            {(['line', 'candlestick'] as ChartType[]).map(t => (
              <button
                key={t}
                onClick={() => setChartType(t)}
                className={cn(
                  'px-3 py-1 text-xs capitalize transition-colors',
                  chartType === t ? 'text-white' : 'text-muted hover:text-primary',
                )}
                style={chartType === t ? { backgroundColor: accentColor } : {}}
              >
                {t === 'candlestick' ? 'OHLC' : 'Line'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {RANGES.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-2 py-0.5 rounded text-xs uppercase transition-colors',
              range === r ? 'text-white font-medium' : 'text-muted hover:text-primary',
            )}
            style={range === r ? { backgroundColor: accentColor } : {}}
          >
            {r}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-72" />
      ) : (
        <Plot
          data={traceData}
          layout={{
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            font: { family: 'SF Pro Display, -apple-system, sans-serif', color: fontColor },
            margin: { t: 8, b: 32, l: 64, r: 72 },
            xaxis: { anchor: 'y2', gridcolor: gridColor, zerolinecolor: gridColor, showgrid: false, rangeslider: { visible: false } },
            yaxis: { domain: [0.28, 1], gridcolor: gridColor, zerolinecolor: gridColor, ...(chartType === 'line' && closes.length ? { range: [lineYMin, lineYMax] } : {}) },
            yaxis2: { domain: [0, 0.28], gridcolor: gridColor, zerolinecolor: gridColor, showticklabels: false, fixedrange: true },
            bargap: 0.01,
            hovermode: 'x unified',
            ...(chartType === 'line' && closes.length ? {
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
            } : {}),
          }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '500px' }}
        />
      )}
    </div>
  )
}
