from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal
from app.database import get_db
from app.models.models import Transaction
from app.schemas.schemas import (
    PortfolioSummary, PositionOut, CompositionItem,
    PerformancePoint, RiskMetrics,
)
from app.services import portfolio_calculator as pc
from app.services.banxico import get_exchange_rate

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])

# In-memory cache for expensive TWR computation (invalidated on tx mutation)
_perf_cache: dict = {}


def _invalidate_perf_cache():
    _perf_cache.clear()


async def _get_rate() -> Decimal:
    try:
        return await get_exchange_rate()
    except Exception:
        return Decimal("17.5")  # fallback if Banxico is unreachable


@router.get("/summary", response_model=PortfolioSummary)
async def portfolio_summary(
    currency: str = Query("MXN"),
    db: Session = Depends(get_db),
):
    rate = await _get_rate()
    all_tx = db.query(Transaction).order_by(Transaction.date).all()
    positions = pc.build_positions(db, rate)
    return pc.build_summary(positions, all_tx, rate, currency.upper())


@router.get("/positions", response_model=list[PositionOut])
async def portfolio_positions(
    currency: str = Query("MXN"),
    db: Session = Depends(get_db),
):
    rate = await _get_rate()
    positions = pc.build_positions(db, rate)
    result = []
    for p in positions:
        def to_display(amount, native_cur):
            if amount is None:
                return None
            if currency.upper() == "USD" and native_cur == "MXN":
                return amount / rate
            if currency.upper() == "MXN" and native_cur == "USD":
                return amount * rate
            return amount

        cur = p["currency"]
        result.append(PositionOut(
            ticker=p["ticker"],
            currency=cur,
            shares_held=p["shares_held"],
            avg_cost=p["avg_cost"],
            invested_amount=to_display(p["invested_amount"], cur),
            market_price=p["market_price"],
            current_value=to_display(p["current_value"], cur),
            unrealized_pnl=to_display(p["unrealized_pnl"], cur),
            unrealized_pnl_pct=p["unrealized_pnl_pct"],
            portfolio_pct=p["portfolio_pct"],
            price_stale=p["price_stale"],
            is_cash=p.get("is_cash", False),
        ))
    return result


@router.get("/composition", response_model=list[CompositionItem])
async def portfolio_composition(
    currency: str = Query("MXN"),
    db: Session = Depends(get_db),
):
    rate = await _get_rate()
    positions = pc.build_positions(db, rate)
    return pc.build_composition(positions, rate, currency.upper())


@router.get("/performance", response_model=list[PerformancePoint])
async def portfolio_performance(
    currency: str = Query("MXN"),
    ticker_currency: str | None = Query(None),
    db: Session = Depends(get_db),
):
    tc = ticker_currency.upper() if ticker_currency else None
    cache_key = f"{currency.upper()}:{tc or 'ALL'}"
    if cache_key in _perf_cache:
        return _perf_cache[cache_key]

    rate = await _get_rate()
    points = pc.build_performance(db, rate, currency.upper(), tc)
    _perf_cache[cache_key] = points
    return points


@router.get("/risk-metrics", response_model=RiskMetrics)
async def risk_metrics(
    currency: str = Query("MXN"),
    db: Session = Depends(get_db),
):
    cache_key = currency.upper()
    if cache_key not in _perf_cache:
        rate = await _get_rate()
        _perf_cache[cache_key] = pc.build_performance(db, rate, currency.upper())

    metrics = pc.build_risk_metrics(_perf_cache[cache_key])
    return RiskMetrics(**metrics)
