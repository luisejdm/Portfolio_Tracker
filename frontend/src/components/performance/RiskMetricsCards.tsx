import { useRiskMetrics } from '@/hooks/usePortfolio'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPct } from '@/lib/utils'

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-primary">{value}</p>
    </div>
  )
}

export function RiskMetricsCards() {
  const { data, isLoading } = useRiskMetrics()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    )
  }

  if (!data) return null

  const fmt = (v: string | null) => v ? formatPct(v) : '—'

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <MetricCard label="Annualized Volatility" value={fmt(data.annualized_volatility)} />
      <MetricCard label="Max Drawdown" value={data.max_drawdown ? `-${parseFloat(data.max_drawdown).toFixed(2)}%` : '—'} />
      <MetricCard label="Sharpe Ratio" value={data.sharpe_ratio ? parseFloat(data.sharpe_ratio).toFixed(2) : '—'} />
      <MetricCard label="Best Day" value={fmt(data.best_day)} />
      <MetricCard label="Worst Day" value={fmt(data.worst_day)} />
    </div>
  )
}
