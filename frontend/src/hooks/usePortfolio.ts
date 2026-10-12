import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { useUIStore } from '@/store/uiStore'
import type { PortfolioSummary, Position, CompositionItem, PerformancePoint, RiskMetrics, ExchangeRateOut } from '@/types'

export function useExchangeRate() {
  return useQuery<ExchangeRateOut>({
    queryKey: ['exchange-rate'],
    queryFn: () => api.get('/exchange-rate').then(r => r.data),
    staleTime: 1000 * 60 * 15,
  })
}

export function usePortfolioSummary() {
  const currency = useUIStore(s => s.displayCurrency)
  return useQuery<PortfolioSummary>({
    queryKey: ['portfolio-summary', currency],
    queryFn: () => api.get('/portfolio/summary', { params: { currency } }).then(r => r.data),
  })
}

export function usePositions() {
  const currency = useUIStore(s => s.displayCurrency)
  return useQuery<Position[]>({
    queryKey: ['portfolio-positions', currency],
    queryFn: () => api.get('/portfolio/positions', { params: { currency } }).then(r => r.data),
  })
}

export function useComposition() {
  const currency = useUIStore(s => s.displayCurrency)
  return useQuery<CompositionItem[]>({
    queryKey: ['portfolio-composition', currency],
    queryFn: () => api.get('/portfolio/composition', { params: { currency } }).then(r => r.data),
  })
}

export function usePerformance(tickerCurrency?: string) {
  const currency = useUIStore(s => s.displayCurrency)
  const tc = tickerCurrency && tickerCurrency !== 'ALL' ? tickerCurrency : undefined
  return useQuery<PerformancePoint[]>({
    queryKey: ['portfolio-performance', currency, tc ?? 'ALL'],
    queryFn: () => api.get('/portfolio/performance', { params: { currency, ...(tc && { ticker_currency: tc }) } }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}

export function useRiskMetrics() {
  const currency = useUIStore(s => s.displayCurrency)
  return useQuery<RiskMetrics>({
    queryKey: ['portfolio-risk', currency],
    queryFn: () => api.get('/portfolio/risk-metrics', { params: { currency } }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
  })
}
