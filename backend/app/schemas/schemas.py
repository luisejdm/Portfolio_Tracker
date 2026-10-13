from pydantic import BaseModel, field_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional


# --- Transactions ---

class TransactionBase(BaseModel):
    ticker: str
    type: str  # "buy" | "sell"
    date: date
    shares: Decimal
    price_per_share: Decimal
    currency: str
    commission_pct: Decimal = Decimal("0")
    tax_pct: Optional[Decimal] = None
    notes: Optional[str] = None

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("buy", "sell"):
            raise ValueError("type must be 'buy' or 'sell'")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        if v not in ("MXN", "USD"):
            raise ValueError("currency must be 'MXN' or 'USD'")
        return v.upper()


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionOut(TransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Portfolio ---

class PositionOut(BaseModel):
    ticker: str
    currency: str
    shares_held: Decimal
    avg_cost: Decimal
    invested_amount: Decimal
    market_price: Optional[Decimal]
    current_value: Optional[Decimal]
    unrealized_pnl: Optional[Decimal]
    unrealized_pnl_pct: Optional[Decimal]
    portfolio_pct: Optional[Decimal]
    day_change: Optional[Decimal]
    day_change_pct: Optional[Decimal]
    price_stale: bool = False
    is_cash: bool = False


class PortfolioSummary(BaseModel):
    total_current_value: Decimal
    total_invested: Decimal
    available_cash: Decimal
    total_unrealized_pnl: Decimal
    total_unrealized_pnl_pct: Decimal
    total_realized_pnl: Decimal
    total_pnl: Decimal
    total_return_pct: Decimal
    display_currency: str
    exchange_rate: Optional[Decimal]


class CompositionItem(BaseModel):
    ticker: str
    value: Decimal
    pct: Decimal
    currency: str


class PerformancePoint(BaseModel):
    date: date
    portfolio_value: Decimal
    twr: Optional[Decimal] = None


# --- Market Data ---

class PriceOut(BaseModel):
    ticker: str
    price: Decimal
    currency: str
    stale: bool = False


class OHLCVPoint(BaseModel):
    date: date
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: int


class ExchangeRateOut(BaseModel):
    rate: Decimal
    source: str = "Banxico"


class AnalystRecommendation(BaseModel):
    period: str
    strongBuy: int = 0
    buy: int = 0
    hold: int = 0
    sell: int = 0
    strongSell: int = 0


class TickerDetail(BaseModel):
    ticker: str
    shortName: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    fullExchangeName: Optional[str] = None
    website: Optional[str] = None
    longBusinessSummary: Optional[str] = None
    # Price snapshot
    dayLow: Optional[float] = None
    dayHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    beta: Optional[float] = None
    volume: Optional[int] = None
    averageVolume: Optional[int] = None
    marketCap: Optional[int] = None
    dividendYield: Optional[float] = None
    # Valuation
    trailingPE: Optional[float] = None
    forwardPE: Optional[float] = None
    priceToBook: Optional[float] = None
    pegRatio: Optional[float] = None
    trailingEps: Optional[float] = None
    forwardEps: Optional[float] = None
    # Growth & Margins
    revenueGrowth: Optional[float] = None
    earningsGrowth: Optional[float] = None
    grossMargins: Optional[float] = None
    operatingMargins: Optional[float] = None
    profitMargins: Optional[float] = None
    returnOnEquity: Optional[float] = None
    # Dividends
    dividendRate: Optional[float] = None
    exDividendDate: Optional[str] = None
    # Analyst targets
    targetLowPrice: Optional[float] = None
    targetMeanPrice: Optional[float] = None
    targetMedianPrice: Optional[float] = None
    targetHighPrice: Optional[float] = None
    recommendationKey: Optional[str] = None
    numberOfAnalystOpinions: Optional[int] = None
    currentPrice: Optional[float] = None
    recommendations: list[AnalystRecommendation] = []
