import { useState } from 'react'
import { KPICards } from '@/components/dashboard/KPICards'
import { CompositionChart } from '@/components/dashboard/CompositionChart'
import { PositionsTable } from '@/components/dashboard/PositionsTable'
import { PortfolioValueChart, type Range } from '@/components/performance/PortfolioValueChart'
import { useRefreshPrices } from '@/hooks/useMarketData'
import { useExchangeRate } from '@/hooks/usePortfolio'
import { useUIStore } from '@/store/uiStore'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Filter = 'ALL' | 'MXN' | 'USD'

export function Dashboard() {
  const [filter, setFilter] = useState<Filter>('ALL')
  const [range, setRange] = useState<Range>('1Y')
  const { displayCurrency, setDisplayCurrency, accentColor } = useUIStore()
  const refresh = useRefreshPrices()
  const { data: fxData } = useExchangeRate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {(['ALL', 'MXN', 'USD'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded text-sm transition-colors',
                filter === f ? 'text-white font-medium' : 'text-muted hover:text-primary',
              )}
              style={filter === f ? { backgroundColor: accentColor } : {}}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {fxData && (
            <span className="text-xs text-muted tabular-nums">
              1 USD = <span className="text-primary font-medium">${Number(fxData.rate).toFixed(2)} MXN</span>
            </span>
          )}
          <div className="flex rounded-md overflow-hidden border border-border">
            {(['MXN', 'USD'] as const).map(c => (
              <button
                key={c}
                onClick={() => setDisplayCurrency(c)}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  displayCurrency === c ? 'text-white font-medium' : 'text-muted hover:text-primary',
                )}
                style={displayCurrency === c ? { backgroundColor: accentColor } : {}}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md transition-opacity disabled:opacity-60"
            style={{ backgroundColor: accentColor }}
          >
            <RefreshCw size={14} className={refresh.isPending ? 'animate-spin' : ''} />
            Refresh Prices
          </button>
        </div>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4">
        <CompositionChart currencyFilter={filter} />
        <PortfolioValueChart range={range} onRangeChange={setRange} height="340px" currencyFilter={filter} />
      </div>

      <div>
        <p className="text-sm font-semibold text-primary mb-3">Open Positions</p>
        <PositionsTable currencyFilter={filter} />
      </div>
    </div>
  )
}
