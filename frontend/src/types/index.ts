export interface Transaction {
  id: number
  ticker: string
  type: 'buy' | 'sell'
  date: string
  shares: string
  price_per_share: string
  currency: 'MXN' | 'USD'
  commission_pct: string
  tax_pct: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TransactionPayload {
  ticker: string
  type: 'buy' | 'sell'
  date: string
  shares: number
  price_per_share: number
  currency: 'MXN' | 'USD'
  commission_pct: number
  notes?: string | null
}

export interface Position {
  ticker: string
  currency: 'MXN' | 'USD'
  shares_held: string
  avg_cost: string
  invested_amount: string
  market_price: string | null
  current_value: string | null
  unrealized_pnl: string | null
  unrealized_pnl_pct: string | null
  portfolio_pct: string | null
  day_change: string | null
  day_change_pct: string | null
  price_stale: boolean
  is_cash?: boolean
}

export interface PortfolioSummary {
  total_current_value: string
  total_invested: string
  available_cash: string
  total_unrealized_pnl: string
  total_unrealized_pnl_pct: string
  total_realized_pnl: string
  total_pnl: string
  total_return_pct: string
  display_currency: string
  exchange_rate: string | null
}

export interface CompositionItem {
  ticker: string
  value: string
  pct: string
  currency: string
}

export interface PerformancePoint {
  date: string
  portfolio_value: string
  twr: string | null
}

export interface RiskMetrics {
  annualized_volatility: string | null
  max_drawdown: string | null
  sharpe_ratio: string | null
  best_day: string | null
  worst_day: string | null
}

export interface PriceOut {
  ticker: string
  price: string
  currency: string
  stale: boolean
}

export interface OHLCVPoint {
  date: string
  open: string
  high: string
  low: string
  close: string
  volume: number
}

export interface ExchangeRateOut {
  rate: string
  source: string
}

export interface PortfolioInfo {
  portfolios: string[]
  active: string
}

export interface AnalystRecommendation {
  period: string
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export interface TickerInfo {
  ticker: string
  shortName: string | null
  sector: string | null
  industry: string | null
  fullExchangeName: string | null
  website: string | null
  longBusinessSummary: string | null
  dayLow: number | null
  dayHigh: number | null
  fiftyTwoWeekLow: number | null
  fiftyTwoWeekHigh: number | null
  beta: number | null
  volume: number | null
  averageVolume: number | null
  marketCap: number | null
  dividendYield: number | null
  trailingPE: number | null
  forwardPE: number | null
  priceToBook: number | null
  pegRatio: number | null
  trailingEps: number | null
  forwardEps: number | null
  revenueGrowth: number | null
  earningsGrowth: number | null
  grossMargins: number | null
  operatingMargins: number | null
  profitMargins: number | null
  returnOnEquity: number | null
  dividendRate: number | null
  exDividendDate: string | null
  targetLowPrice: number | null
  targetMeanPrice: number | null
  targetMedianPrice: number | null
  targetHighPrice: number | null
  recommendationKey: string | null
  numberOfAnalystOpinions: number | null
  currentPrice: number | null
  recommendations: AnalystRecommendation[]
}
