import { usePortfolioSummary } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { formatCurrency, formatPct, pnlColor } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

function KPICard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3">
      <p className="text-xs text-muted mb-1 truncate">{label}</p>
      <div className="text-lg font-semibold tabular-nums text-primary">{value}</div>
      {sub && <div className="text-xs mt-0.5 tabular-nums text-muted">{sub}</div>}
    </div>
  )
}

export function KPICards() {
  const { data, isLoading } = usePortfolioSummary()
  const currency = useUIStore(s => s.displayCurrency)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const fmt = (v: string) => formatCurrency(v, currency)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        label="Portfolio Value"
        value={fmt(data.total_current_value)}
      />
      <KPICard
        label="Contributed Capital"
        value={fmt(data.total_invested)}
      />
      <KPICard
        label="Available Cash"
        value={fmt(data.available_cash)}
      />
      <KPICard
        label="Unrealized P&L"
        value={
          <span className={pnlColor(data.total_unrealized_pnl)}>
            {fmt(data.total_unrealized_pnl)}
          </span>
        }
        sub={
          <span className={pnlColor(data.total_unrealized_pnl_pct)}>
            {formatPct(data.total_unrealized_pnl_pct)}
          </span>
        }
      />
      <KPICard
        label="Realized P&L"
        value={
          <span className={pnlColor(data.total_realized_pnl)}>
            {fmt(data.total_realized_pnl)}
          </span>
        }
      />
      <KPICard
        label="Total Return"
        value={
          <span className={pnlColor(data.total_return_pct)}>
            {formatPct(data.total_return_pct)}
          </span>
        }
        sub={
          <span className={pnlColor(data.total_pnl)}>
            {fmt(data.total_pnl)}
          </span>
        }
      />
    </div>
  )
}
