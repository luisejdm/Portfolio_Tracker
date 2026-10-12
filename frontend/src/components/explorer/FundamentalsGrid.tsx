import type { ReactNode } from 'react'
import type { TickerInfo } from '@/types'

interface Props { info: TickerInfo }

function fmt(n: number | null, decimals = 2) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function fmtPct(n: number | null) {
  if (n == null) return '—'
  return `${(n * 100).toFixed(1)}%`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs font-medium text-primary tabular-nums">{value}</span>
    </div>
  )
}

function Col({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <p className="text-xs font-semibold text-muted tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

export function FundamentalsGrid({ info }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Col title="Valuation">
        <Row label="P/E (Trailing)" value={fmt(info.trailingPE)} />
        <Row label="P/E (Forward)" value={fmt(info.forwardPE)} />
        <Row label="P/B" value={fmt(info.priceToBook)} />
        <Row label="PEG Ratio" value={fmt(info.pegRatio)} />
        <Row label="EPS (TTM)" value={fmt(info.trailingEps)} />
        <Row label="EPS (Fwd)" value={fmt(info.forwardEps)} />
      </Col>
      <Col title="Growth & Margins">
        <Row label="Rev. Growth (YoY)" value={fmtPct(info.revenueGrowth)} />
        <Row label="Earnings Growth" value={fmtPct(info.earningsGrowth)} />
        <Row label="Gross Margin" value={fmtPct(info.grossMargins)} />
        <Row label="Operating Margin" value={fmtPct(info.operatingMargins)} />
        <Row label="Profit Margin" value={fmtPct(info.profitMargins)} />
        <Row label="ROE" value={fmtPct(info.returnOnEquity)} />
      </Col>
      <Col title="Dividend">
        <Row label="Dividend Rate" value={info.dividendRate != null ? `$${fmt(info.dividendRate)}` : '—'} />
        <Row label="Dividend Yield" value={info.dividendYield != null ? `${(info.dividendYield * 100).toFixed(2)}%` : '—'} />
        <Row label="Ex-Dividend Date" value={fmtDate(info.exDividendDate)} />
      </Col>
    </div>
  )
}
