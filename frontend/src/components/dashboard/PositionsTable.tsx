import { usePositions } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { formatPct, formatNumber, pnlColor } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

function fmtAmt(value: number | string | null | undefined, curr: string): string {
  if (value === null || value === undefined) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return `${curr} ${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`
}

type CurrencyFilter = 'ALL' | 'MXN' | 'USD'

interface Props {
  currencyFilter: CurrencyFilter
}

export function PositionsTable({ currencyFilter }: Props) {
  const { data, isLoading } = usePositions()
  const currency = useUIStore(s => s.displayCurrency)

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />
  if (!data || data.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted text-sm">
        No open positions
      </div>
    )
  }

  const filtered = currencyFilter === 'ALL' ? data : data.filter(p => p.currency === currencyFilter)

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border text-muted text-xs">
              <th className="text-left px-4 py-3 font-medium">Ticker</th>
              <th className="text-right px-4 py-3 font-medium">Shares</th>
              <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
              <th className="text-right px-4 py-3 font-medium">Invested</th>
              <th className="text-right px-4 py-3 font-medium">Market Price</th>
              <th className="text-right px-4 py-3 font-medium">Current Value</th>
              <th className="text-right px-4 py-3 font-medium">Unrealized P&L</th>
              <th className="text-right px-4 py-3 font-medium">Portfolio %</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={`${p.ticker}-${p.currency}`} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">{p.ticker}</span>
                    <span className="text-xs text-muted">{p.currency}</span>
                    {p.price_stale && (
                      <span title="Stale price"><AlertCircle size={12} className="text-yellow-500" /></span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-primary">{p.is_cash ? '—' : formatNumber(p.shares_held)}</td>
                <td className="px-4 py-3 text-right text-muted">{p.is_cash ? '—' : fmtAmt(p.avg_cost, p.currency)}</td>
                <td className="px-4 py-3 text-right text-primary">{fmtAmt(p.invested_amount, currency)}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {p.is_cash || !p.market_price ? '—' : fmtAmt(p.market_price, p.currency)}
                </td>
                <td className="px-4 py-3 text-right text-primary">{fmtAmt(p.current_value, currency)}</td>
                <td className="px-4 py-3 text-right">
                  {p.is_cash ? (
                    <div className="text-muted">—</div>
                  ) : (
                    <>
                      <div className={pnlColor(p.unrealized_pnl)}>{fmtAmt(p.unrealized_pnl, currency)}</div>
                      <div className={`text-xs ${pnlColor(p.unrealized_pnl_pct)}`}>{formatPct(p.unrealized_pnl_pct)}</div>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted">{formatPct(p.portfolio_pct, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
