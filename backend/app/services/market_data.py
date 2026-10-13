import yfinance as yf
import pandas as pd
from decimal import Decimal
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.models import PriceCache

STALE_MINUTES = 30

RANGE_MAP = {
    "1w": {"period": "5d"},
    "1m": {"period": "1mo"},
    "3m": {"period": "3mo"},
    "6m": {"period": "6mo"},
    "ytd": {"period": "ytd"},
    "1y": {"period": "1y"},
    "2y": {"period": "2y"},
    "5y": {"period": "5y"},
    "max": {"period": "max"},
}


def _currency_for(ticker: str) -> str:
    return "MXN" if ticker.upper().endswith(".MX") else "USD"


def _fetch_price_from_yfinance(ticker: str) -> Decimal:
    t = yf.Ticker(ticker)

    # Try fast_info properties — attribute names differ between yfinance versions
    for attr in ("lastPrice", "last_price"):
        try:
            val = getattr(t.fast_info, attr)
            if val and float(val) > 0:
                return Decimal(str(val))
        except Exception:
            pass

    # Try info dict (uses quote endpoint)
    try:
        info = t.info
        for key in ("regularMarketPrice", "currentPrice", "navPrice"):
            val = info.get(key)
            if val and float(val) > 0:
                return Decimal(str(val))
    except Exception:
        pass

    # Fallback: pull 2-day history and take the last close
    hist = t.history(period="2d")
    if not hist.empty:
        return Decimal(str(hist["Close"].iloc[-1]))

    raise ValueError(f"No price found for {ticker}")


def get_current_price(ticker: str, db: Session) -> tuple[Decimal, bool]:
    """Returns (price, is_stale). Tries live first, falls back to cache."""
    stale_threshold = datetime.utcnow() - timedelta(minutes=STALE_MINUTES)

    cached = (
        db.query(PriceCache)
        .filter(PriceCache.ticker == ticker.upper())
        .order_by(PriceCache.fetched_at.desc())
        .first()
    )

    if cached and cached.fetched_at >= stale_threshold:
        return Decimal(str(cached.close_price)), False

    try:
        price_dec = _fetch_price_from_yfinance(ticker)
        _upsert_price_cache(db, ticker.upper(), date.today(), price_dec)
        return price_dec, False
    except Exception:
        if cached:
            return Decimal(str(cached.close_price)), True
        raise


def get_price_and_day_change(ticker: str, db: Session) -> tuple[Decimal, bool, Decimal | None, Decimal | None]:
    """Returns (price, is_stale, day_change_abs, day_change_pct).

    Always fetches ticker.info so that currentPrice and previousClose
    are consistent with broker data. Cache is used only as fallback.
    """
    cached = (
        db.query(PriceCache)
        .filter(PriceCache.ticker == ticker.upper())
        .order_by(PriceCache.fetched_at.desc())
        .first()
    )

    try:
        info = yf.Ticker(ticker).info
        precio = info.get("currentPrice") or info.get("regularMarketPrice")
        cierre_anterior = info.get("previousClose")

        if precio is None:
            raise ValueError("No price in info")

        price = Decimal(str(precio))
        _upsert_price_cache(db, ticker.upper(), date.today(), price)

        change = pct = None
        if cierre_anterior:
            prev = Decimal(str(cierre_anterior))
            change = price - prev
            pct = change / prev * 100

        return price, False, change, pct

    except Exception:
        if cached:
            return Decimal(str(cached.close_price)), True, None, None
        raise


def get_historical(ticker: str, range_key: str = "1y") -> pd.DataFrame:
    params = RANGE_MAP.get(range_key, {"period": "1y"})
    hist = yf.Ticker(ticker).history(**params)
    return hist


def refresh_prices(tickers: list[str], db: Session) -> dict[str, Decimal]:
    results = {}
    for ticker in tickers:
        try:
            price, _ = get_current_price(ticker, db)
            results[ticker] = price
        except Exception:
            pass
    return results


def _upsert_price_cache(db: Session, ticker: str, d: date, price: Decimal) -> None:
    existing = (
        db.query(PriceCache)
        .filter(PriceCache.ticker == ticker, PriceCache.date == d)
        .first()
    )
    currency = _currency_for(ticker)
    if existing:
        existing.close_price = price
        existing.fetched_at = datetime.utcnow()
    else:
        db.add(
            PriceCache(
                ticker=ticker,
                date=d,
                close_price=price,
                currency=currency,
                fetched_at=datetime.utcnow(),
            )
        )
    db.commit()


def get_historical_prices_for_tickers(
    tickers: list[str], start: date, end: date, db: Session
) -> dict[str, dict[date, Decimal]]:
    """Fetch daily close prices for multiple tickers over a date range. Uses cache."""
    result: dict[str, dict[date, Decimal]] = {t: {} for t in tickers}

    for ticker in tickers:
        cached_rows = (
            db.query(PriceCache)
            .filter(
                PriceCache.ticker == ticker,
                PriceCache.date >= start,
                PriceCache.date <= end,
            )
            .all()
        )
        cached_map = {row.date: Decimal(str(row.close_price)) for row in cached_rows}

        try:
            hist = yf.Ticker(ticker).history(
                start=start.isoformat(), end=end.isoformat()
            )
            currency = _currency_for(ticker)
            for ts, row in hist.iterrows():
                price = Decimal(str(row["Close"]))
                if not price.is_finite():
                    continue  # yfinance returns NaN for some days (holidays, gaps)
                d = ts.date()
                cached_map[d] = price
                _upsert_price_cache(db, ticker, d, price)
        except Exception:
            db.rollback()

        result[ticker] = cached_map

    return result
