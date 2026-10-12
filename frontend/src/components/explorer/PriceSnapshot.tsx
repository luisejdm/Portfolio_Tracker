import type { TickerInfo } from '@/types'

interface Props { info: TickerInfo; currency: string }

function fmt(n: number | null, decimals = 2) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtLarge(n: number | null) {
  if (n == null) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  return n.toLocaleString('en-US')
}

function fmtVol(v: number | null, avg: number | null) {
  if (v == null && avg == null) return '—'
  const parts = [v != null ? fmtLarge(v) : null, avg != null ? fmtLarge(avg) : null]
  return parts.filter(Boolean).join(' / ')
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-muted tracking-wide truncate">{label}</span>
      <span className="text-sm font-medium text-primary tabular-nums truncate">{value}</span>
    </div>
  )
}

export function PriceSnapshot({ info, currency }: Props) {
  const divYield = info.dividendYield != null
    ? `${(info.dividendYield * 100).toFixed(2)}%`
    : '—'

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
      <Chip
        label="Day Range"
        value={info.dayLow != null && info.dayHigh != null
          ? `${fmt(info.dayLow)} – ${fmt(info.dayHigh)}`
          : '—'}
      />
      <Chip
        label="52W Range"
        value={info.fiftyTwoWeekLow != null && info.fiftyTwoWeekHigh != null
          ? `${fmt(info.fiftyTwoWeekLow)} – ${fmt(info.fiftyTwoWeekHigh)}`
          : '—'}
      />
      <Chip label="Beta" value={fmt(info.beta)} />
      <Chip label="Vol / Avg Vol" value={fmtVol(info.volume, info.averageVolume)} />
      <Chip label="Mkt Cap" value={fmtLarge(info.marketCap)} />
      <Chip label={`Div Yield (${currency})`} value={divYield} />
    </div>
  )
}
