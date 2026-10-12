import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { OHLCVPoint, PriceOut, TickerInfo } from '@/types'

export function useTickerHistory(ticker: string, range: string) {
  return useQuery<OHLCVPoint[]>({
    queryKey: ['ticker-history', ticker, range],
    queryFn: () => api.get(`/market/history/${ticker}`, { params: { range } }).then(r => r.data),
    enabled: !!ticker,
  })
}

export function useTickerPrice(ticker: string) {
  return useQuery<PriceOut>({
    queryKey: ['ticker-price', ticker],
    queryFn: () => api.get(`/market/price/${ticker}`).then(r => r.data),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 15,
  })
}

export function useTickerInfo(ticker: string) {
  return useQuery<TickerInfo>({
    queryKey: ['ticker-info', ticker],
    queryFn: () => api.get(`/market/info/${ticker}`).then(r => r.data),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 30,
  })
}

export function useRefreshPrices() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.get('/market/refresh').then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['portfolio-positions'] })
      qc.invalidateQueries({ queryKey: ['portfolio-summary'] })
      qc.invalidateQueries({ queryKey: ['portfolio-composition'] })
    },
  })
}
