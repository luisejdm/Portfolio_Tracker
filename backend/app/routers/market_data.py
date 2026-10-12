from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from decimal import Decimal
from app.database import get_db
from app.models.models import Transaction
from app.schemas.schemas import PriceOut, OHLCVPoint, ExchangeRateOut, TickerDetail, AnalystRecommendation
from app.services import market_data as md
from app.services.banxico import get_exchange_rate

router = APIRouter(tags=["market"])


@router.get("/api/market/refresh")
def refresh_prices(db: Session = Depends(get_db)):
    tickers = [
        row.ticker
        for row in db.query(Transaction.ticker).distinct().all()
    ]
    updated = md.refresh_prices(tickers, db)
    return {"updated": len(updated), "tickers": list(updated.keys())}


@router.get("/api/market/price/{ticker}", response_model=PriceOut)
def get_price(ticker: str, db: Session = Depends(get_db)):
    ticker = ticker.upper()
    try:
        price, stale = md.get_current_price(ticker, db)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    currency = "MXN" if ticker.endswith(".MX") else "USD"
    return PriceOut(ticker=ticker, price=price, currency=currency, stale=stale)


@router.get("/api/market/history/{ticker}", response_model=list[OHLCVPoint])
def get_history(
    ticker: str,
    range: str = Query("1y", alias="range"),
):
    ticker = ticker.upper()
    try:
        hist = md.get_historical(ticker, range)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    points = []
    for ts, row in hist.iterrows():
        points.append(
            OHLCVPoint(
                date=ts.date(),
                open=Decimal(str(row["Open"])),
                high=Decimal(str(row["High"])),
                low=Decimal(str(row["Low"])),
                close=Decimal(str(row["Close"])),
                volume=int(row["Volume"]),
            )
        )
    return points


@router.get("/api/exchange-rate", response_model=ExchangeRateOut)
async def exchange_rate():
    try:
        rate = await get_exchange_rate()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Banxico error: {exc}")
    return ExchangeRateOut(rate=rate)


@router.get("/api/market/info/{ticker}", response_model=TickerDetail)
def get_ticker_info(ticker: str):
    import yfinance as yf
    ticker = ticker.upper()
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    recs: list[AnalystRecommendation] = []
    try:
        rec_df = t.recommendations_summary
        if rec_df is not None and not rec_df.empty:
            for _, row in rec_df.head(4).iterrows():
                recs.append(AnalystRecommendation(
                    period=str(row.get("period", "")),
                    strongBuy=int(row.get("strongBuy", 0) or 0),
                    buy=int(row.get("buy", 0) or 0),
                    hold=int(row.get("hold", 0) or 0),
                    sell=int(row.get("sell", 0) or 0),
                    strongSell=int(row.get("strongSell", 0) or 0),
                ))
    except Exception:
        pass

    def g(key):
        v = info.get(key)
        return None if v in (None, "N/A", "", 0) or (isinstance(v, float) and v != v) else v

    def gf(key):
        v = info.get(key)
        if v is None or v == "N/A" or v == "":
            return None
        try:
            f = float(v)
            return None if f != f else f
        except Exception:
            return None

    ex_div = info.get("exDividendDate")
    ex_div_str = None
    if ex_div:
        try:
            from datetime import datetime
            ex_div_str = datetime.utcfromtimestamp(int(ex_div)).strftime("%Y-%m-%d")
        except Exception:
            ex_div_str = str(ex_div)

    return TickerDetail(
        ticker=ticker,
        shortName=g("shortName"),
        sector=g("sector"),
        industry=g("industry"),
        fullExchangeName=g("fullExchangeName"),
        website=g("website"),
        longBusinessSummary=g("longBusinessSummary"),
        dayLow=gf("dayLow"),
        dayHigh=gf("dayHigh"),
        fiftyTwoWeekLow=gf("fiftyTwoWeekLow"),
        fiftyTwoWeekHigh=gf("fiftyTwoWeekHigh"),
        beta=gf("beta"),
        volume=g("volume"),
        averageVolume=g("averageVolume"),
        marketCap=g("marketCap"),
        dividendYield=gf("dividendYield"),
        trailingPE=gf("trailingPE"),
        forwardPE=gf("forwardPE"),
        priceToBook=gf("priceToBook"),
        pegRatio=gf("pegRatio"),
        trailingEps=gf("trailingEps"),
        forwardEps=gf("forwardEps"),
        revenueGrowth=gf("revenueGrowth"),
        earningsGrowth=gf("earningsGrowth"),
        grossMargins=gf("grossMargins"),
        operatingMargins=gf("operatingMargins"),
        profitMargins=gf("profitMargins"),
        returnOnEquity=gf("returnOnEquity"),
        dividendRate=gf("dividendRate"),
        exDividendDate=ex_div_str,
        targetLowPrice=gf("targetLowPrice"),
        targetMeanPrice=gf("targetMeanPrice"),
        targetMedianPrice=gf("targetMedianPrice"),
        targetHighPrice=gf("targetHighPrice"),
        recommendationKey=g("recommendationKey"),
        numberOfAnalystOpinions=g("numberOfAnalystOpinions"),
        currentPrice=gf("currentPrice"),
        recommendations=recs,
    )
