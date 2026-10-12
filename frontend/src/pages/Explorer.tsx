import { useState } from 'react'
import { TickerSearch } from '@/components/explorer/TickerSearch'
import { PriceHistoryChart } from '@/components/explorer/PriceHistoryChart'
import { PriceSnapshot } from '@/components/explorer/PriceSnapshot'
import { FundamentalsGrid } from '@/components/explorer/FundamentalsGrid'
import { AnalystPriceTarget } from '@/components/explorer/AnalystPriceTarget'
import { AnalystRecommendations } from '@/components/explorer/AnalystRecommendations'
import { AboutSection } from '@/components/explorer/AboutSection'
import { useTickerInfo } from '@/hooks/useMarketData'
import { Skeleton } from '@/components/ui/skeleton'

export function Explorer() {
  const [ticker, setTicker] = useState('')
  const { data: info, isLoading: infoLoading } = useTickerInfo(ticker)
  const currency = ticker.endsWith('.MX') ? 'MXN' : 'USD'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-primary">Explorer</h1>
      </div>

      <TickerSearch onSearch={setTicker} />

      {!ticker && (
        <div className="bg-surface border border-border rounded-xl p-12 text-center text-muted text-sm">
          Search for a ticker to see its price history and fundamentals
        </div>
      )}

      {ticker && (
        <div className="space-y-4">
          <PriceHistoryChart ticker={ticker} info={info} />

          {infoLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : info ? (
            <PriceSnapshot info={info} currency={currency} />
          ) : null}

          {infoLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : info ? (
            <FundamentalsGrid info={info} />
          ) : null}

          {infoLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : info ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnalystPriceTarget info={info} />
              <AnalystRecommendations info={info} />
            </div>
          ) : null}

          {info && <AboutSection info={info} />}
        </div>
      )}
    </div>
  )
}
