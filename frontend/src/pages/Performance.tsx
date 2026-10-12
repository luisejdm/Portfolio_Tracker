import { useState } from 'react'
import { PortfolioValueChart } from '@/components/performance/PortfolioValueChart'
import { TWRChart } from '@/components/performance/TWRChart'
import { RiskMetricsCards } from '@/components/performance/RiskMetricsCards'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'

const RANGES = ['1M', '3M', '6M', 'YTD', '1Y', '2Y', 'MAX'] as const
type Range = typeof RANGES[number]

export function Performance() {
  const [range, setRange] = useState<Range>('1Y')
  const { displayCurrency, setDisplayCurrency, accentColor } = useUIStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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
      </div>

      <RiskMetricsCards />
      <PortfolioValueChart range={range} onRangeChange={setRange} />
      <TWRChart range={range} onRangeChange={setRange} />
    </div>
  )
}
