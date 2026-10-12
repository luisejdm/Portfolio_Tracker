from decimal import Decimal, ROUND_HALF_UP
from datetime import date, timedelta
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.models import Transaction
from app.services.market_data import get_current_price, get_historical_prices_for_tickers

RISK_FREE_RATE = Decimal("0.04")
TWO_PLACES = Decimal("0.01")


def _detect_currency(ticker: str) -> str:
    return "MXN" if ticker.upper().endswith(".MX") else "USD"


# ---------------------------------------------------------------------------
# Cost basis helpers
# ---------------------------------------------------------------------------

def _compute_weighted_avg_cost(transactions: list[Transaction]) -> Decimal:
    total_cost = Decimal("0")
    total_shares = Decimal("0")
    for tx in transactions:
        if tx.type == "buy":
            effective = Decimal(str(tx.price_per_share)) * (
                1 + Decimal(str(tx.commission_pct)) / 100
            )
            total_cost += Decimal(str(tx.shares)) * effective
            total_shares += Decimal(str(tx.shares))
    if total_shares == 0:
        return Decimal("0")
    return total_cost / total_shares


def _compute_shares_held(transactions: list[Transaction]) -> Decimal:
    held = Decimal("0")
    for tx in transactions:
        if tx.type == "buy":
            held += Decimal(str(tx.shares))
        else:
            held -= Decimal(str(tx.shares))
    return held


def _compute_realized_pnl(transactions: list[Transaction]) -> Decimal:
    """Realized P&L using weighted average cost at time of each sell."""
    realized = Decimal("0")
    running_cost = Decimal("0")
    running_shares = Decimal("0")

    for tx in sorted(transactions, key=lambda t: t.date):
        if tx.type == "buy":
            effective = Decimal(str(tx.price_per_share)) * (
                1 + Decimal(str(tx.commission_pct)) / 100
            )
            running_cost += Decimal(str(tx.shares)) * effective
            running_shares += Decimal(str(tx.shares))
        else:
            wac = running_cost / running_shares if running_shares > 0 else Decimal("0")
            net_sell = Decimal(str(tx.price_per_share)) * (
                1 - Decimal(str(tx.commission_pct)) / 100
            )
            realized += (net_sell - wac) * Decimal(str(tx.shares))
            running_shares -= Decimal(str(tx.shares))
            if running_shares > 0:
                running_cost = wac * running_shares
            else:
                running_cost = Decimal("0")

    return realized


def _compute_cash_flows(
    transactions: list[Transaction],
    exchange_rate: Decimal,
    up_to_date: date | None = None,
) -> tuple[Decimal, Decimal]:
    """
    Models the brokerage account as a single cash pool denominated in MXN.
    Sell proceeds sit as uninvested cash and fund subsequent buys (even
    cross-currency ones, which the broker converts under the hood) before
    external capital is counted.

    On same-day transactions, sells are processed before buys so that
    freed-up proceeds can fund the day's buys without inflating ext capital.

    Returns:
        cash_balance: uninvested cash remaining (MXN)
        ext_capital:  external capital deposited from outside (MXN)
    """
    cash = Decimal("0")
    ext = Decimal("0")

    def sort_key(tx):
        return (tx.date, 0 if tx.type == "sell" else 1)

    for tx in sorted(transactions, key=sort_key):
        if up_to_date is not None and tx.date > up_to_date:
            break
        currency = _detect_currency(tx.ticker)
        gross = Decimal(str(tx.price_per_share)) * Decimal(str(tx.shares))

        if tx.type == "sell":
            proceeds = gross * (1 - Decimal(str(tx.commission_pct)) / 100)
            if currency == "USD":
                proceeds *= exchange_rate
            cash += proceeds
        else:
            cost = gross * (1 + Decimal(str(tx.commission_pct)) / 100)
            if currency == "USD":
                cost *= exchange_rate
            from_cash = min(cash, cost)
            cash -= from_cash
            ext += cost - from_cash

    return cash, ext


# ---------------------------------------------------------------------------
# Position builder
# ---------------------------------------------------------------------------

def build_positions(db: Session, exchange_rate: Decimal) -> list[dict]:
    all_tx = db.query(Transaction).order_by(Transaction.date).all()
    by_ticker: dict[str, list[Transaction]] = defaultdict(list)
    for tx in all_tx:
        by_ticker[tx.ticker].append(tx)

    positions = []
    for ticker, txs in by_ticker.items():
        shares_held = _compute_shares_held(txs)
        if shares_held < Decimal("0.00000001"):
            continue

        wac = _compute_weighted_avg_cost(txs)
        invested = shares_held * wac
        currency = _detect_currency(ticker)

        try:
            market_price, stale = get_current_price(ticker, db)
            current_value = shares_held * market_price
            unrealized_pnl = current_value - invested
            unrealized_pnl_pct = (unrealized_pnl / invested * 100) if invested else Decimal("0")
        except Exception:
            market_price = None
            current_value = None
            unrealized_pnl = None
            unrealized_pnl_pct = None
            stale = False

        positions.append({
            "ticker": ticker,
            "currency": currency,
            "shares_held": shares_held,
            "avg_cost": wac,
            "invested_amount": invested,
            "market_price": market_price,
            "current_value": current_value,
            "unrealized_pnl": unrealized_pnl,
            "unrealized_pnl_pct": unrealized_pnl_pct,
            "portfolio_pct": None,  # filled after totalling
            "price_stale": stale,
            "realized_pnl": _compute_realized_pnl(txs),
            "is_cash": False,
        })

    # Append cash pseudo-position (always in MXN since cash is pooled)
    cash_mxn, _ = _compute_cash_flows(all_tx, exchange_rate)
    if cash_mxn > Decimal("0.01"):
        positions.append({
            "ticker": "CASH",
            "currency": "MXN",
            "shares_held": cash_mxn,
            "avg_cost": Decimal("1"),
            "invested_amount": cash_mxn,
            "market_price": Decimal("1"),
            "current_value": cash_mxn,
            "unrealized_pnl": Decimal("0"),
            "unrealized_pnl_pct": Decimal("0"),
            "portfolio_pct": None,
            "price_stale": False,
            "realized_pnl": Decimal("0"),
            "is_cash": True,
        })

    # Fill portfolio_pct, normalizing all values to MXN so cross-currency
    # positions get a correct share (prior behaviour summed native values).
    def _to_mxn(amount: Decimal, native: str) -> Decimal:
        return amount * exchange_rate if native == "USD" else amount

    total_value_mxn = sum(
        _to_mxn(p["current_value"] or Decimal("0"), p["currency"]) for p in positions
    )
    if total_value_mxn > 0:
        for p in positions:
            cv_mxn = _to_mxn(p["current_value"] or Decimal("0"), p["currency"])
            p["portfolio_pct"] = cv_mxn / total_value_mxn * 100

    return positions


# ---------------------------------------------------------------------------
# Portfolio summary
# ---------------------------------------------------------------------------

def build_summary(
    positions: list[dict],
    all_tx: list[Transaction],
    exchange_rate: Decimal,
    display_currency: str,
) -> dict:
    def to_display(amount: Decimal, native_currency: str) -> Decimal:
        if display_currency == "USD" and native_currency == "MXN":
            return amount / exchange_rate
        if display_currency == "MXN" and native_currency == "USD":
            return amount * exchange_rate
        return amount

    # Value includes stock positions AND uninvested cash (cash is already a
    # pseudo-position in `positions`). Unrealized P&L excludes cash.
    total_current_value = Decimal("0")
    total_unrealized = Decimal("0")
    for p in positions:
        cur = p["currency"]
        total_current_value += to_display(p["current_value"] or Decimal("0"), cur)
        if not p.get("is_cash"):
            total_unrealized += to_display(p["unrealized_pnl"] or Decimal("0"), cur)

    # Contributed capital = money that actually came from the user's bank account
    # (sell proceeds consumed by subsequent buys — even cross-currency — are
    # reinvestments, not new deposits).
    cash_mxn, ext_mxn = _compute_cash_flows(all_tx, exchange_rate)
    contributed_capital = to_display(ext_mxn, "MXN")
    available_cash = to_display(cash_mxn, "MXN")

    # Realized P&L from ALL tickers (including fully closed positions)
    by_ticker: dict[str, list[Transaction]] = defaultdict(list)
    for tx in all_tx:
        by_ticker[tx.ticker].append(tx)
    total_realized = Decimal("0")
    for ticker, txs in by_ticker.items():
        realized = _compute_realized_pnl(txs)
        currency = _detect_currency(ticker)
        total_realized += to_display(realized, currency)

    total_pnl = total_unrealized + total_realized
    total_return_pct = (
        total_pnl / contributed_capital * 100 if contributed_capital else Decimal("0")
    )
    unrealized_pnl_pct = (
        total_unrealized / contributed_capital * 100 if contributed_capital else Decimal("0")
    )

    return {
        "total_current_value": total_current_value,
        "total_invested": contributed_capital,
        "available_cash": available_cash,
        "total_unrealized_pnl": total_unrealized,
        "total_unrealized_pnl_pct": unrealized_pnl_pct,
        "total_realized_pnl": total_realized,
        "total_pnl": total_pnl,
        "total_return_pct": total_return_pct,
        "display_currency": display_currency,
        "exchange_rate": exchange_rate,
    }


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------

def build_composition(positions: list[dict], exchange_rate: Decimal, display_currency: str) -> list[dict]:
    def to_display(amount: Decimal, native_currency: str) -> Decimal:
        if display_currency == "USD" and native_currency == "MXN":
            return amount / exchange_rate
        if display_currency == "MXN" and native_currency == "USD":
            return amount * exchange_rate
        return amount

    items = []
    total = Decimal("0")
    for p in positions:
        val = to_display(p["current_value"] or Decimal("0"), p["currency"])
        items.append({"ticker": p["ticker"], "value": val, "currency": p["currency"]})
        total += val

    for item in items:
        item["pct"] = (item["value"] / total * 100) if total else Decimal("0")

    return sorted(items, key=lambda x: x["value"], reverse=True)


# ---------------------------------------------------------------------------
# Performance & TWR
# ---------------------------------------------------------------------------

def build_performance(db: Session, exchange_rate: Decimal, display_currency: str) -> list[dict]:
    all_tx = db.query(Transaction).order_by(Transaction.date).all()
    if not all_tx:
        return []

    tickers = list({tx.ticker for tx in all_tx})
    start = min(tx.date for tx in all_tx)
    end = date.today()

    price_map = get_historical_prices_for_tickers(tickers, start, end, db)

    all_dates: list[date] = []
    current = start
    while current <= end:
        all_dates.append(current)
        current += timedelta(days=1)

    def portfolio_value_on(d: date) -> Decimal:
        # Market value of open positions on date d
        value = Decimal("0")
        holdings: dict[str, Decimal] = defaultdict(Decimal)
        for tx in all_tx:
            if tx.date > d:
                break
            if tx.type == "buy":
                holdings[tx.ticker] += Decimal(str(tx.shares))
            else:
                holdings[tx.ticker] -= Decimal(str(tx.shares))

        for ticker, shares in holdings.items():
            if shares <= 0:
                continue
            prices = price_map.get(ticker, {})
            price = _last_known_price(prices, d)
            if price is None:
                continue
            native_value = shares * price
            currency = _detect_currency(ticker)
            if display_currency == "USD" and currency == "MXN":
                native_value /= exchange_rate
            elif display_currency == "MXN" and currency == "USD":
                native_value *= exchange_rate
            value += native_value

        # Add uninvested cash (sell proceeds not yet redeployed into new buys)
        cash_mxn, _ = _compute_cash_flows(all_tx, exchange_rate, up_to_date=d)
        if display_currency == "USD":
            value += cash_mxn / exchange_rate
        else:
            value += cash_mxn

        return value

    # TWR sub-period computation
    tx_dates = sorted({tx.date for tx in all_tx})
    boundaries = [start] + tx_dates[1:] + [end]
    boundaries = sorted(set(boundaries))

    sub_returns: list[Decimal] = []
    for i in range(len(boundaries) - 1):
        v_start = portfolio_value_on(boundaries[i])
        v_end = portfolio_value_on(boundaries[i + 1])
        if v_start > 0:
            sub_returns.append(v_end / v_start - 1)

    twr_cumulative = Decimal("1")
    twr_at_boundary: dict[date, Decimal] = {}
    for i, r in enumerate(sub_returns):
        twr_cumulative *= (1 + r)
        twr_at_boundary[boundaries[i + 1]] = (twr_cumulative - 1) * 100

    # Sample ~200 data points
    step = max(1, len(all_dates) // 200)
    sampled = all_dates[::step]
    if all_dates[-1] not in sampled:
        sampled.append(all_dates[-1])

    points = []
    for d in sampled:
        val = portfolio_value_on(d)
        closest_twr = _last_known_price(twr_at_boundary, d)
        points.append({
            "date": d,
            "portfolio_value": val,
            "twr": closest_twr,
        })

    return points


def _last_known_price(price_dict: dict[date, Decimal], target: date) -> Decimal | None:
    if target in price_dict:
        return price_dict[target]
    for delta in range(1, 8):
        candidate = target - timedelta(days=delta)
        if candidate in price_dict:
            return price_dict[candidate]
    return None


# ---------------------------------------------------------------------------
# Risk metrics
# ---------------------------------------------------------------------------

def build_risk_metrics(performance_points: list[dict]) -> dict:
    import math

    values = [float(p["portfolio_value"]) for p in performance_points if p["portfolio_value"] > 0]
    if len(values) < 3:
        return {
            "annualized_volatility": None,
            "max_drawdown": None,
            "sharpe_ratio": None,
            "best_day": None,
            "worst_day": None,
        }

    daily_returns = [(values[i] / values[i - 1]) - 1 for i in range(1, len(values))]

    mean_return = sum(daily_returns) / len(daily_returns)
    variance = sum((r - mean_return) ** 2 for r in daily_returns) / len(daily_returns)
    std_dev = math.sqrt(variance)
    annualized_vol = Decimal(str(std_dev * math.sqrt(252)))

    annualized_return = Decimal(str((1 + mean_return) ** 252 - 1))
    sharpe = (
        (annualized_return - RISK_FREE_RATE) / annualized_vol
        if annualized_vol > 0
        else None
    )

    peak = values[0]
    max_dd = 0.0
    for v in values:
        if v > peak:
            peak = v
        dd = (peak - v) / peak
        if dd > max_dd:
            max_dd = dd

    best = max(daily_returns)
    worst = min(daily_returns)

    return {
        "annualized_volatility": annualized_vol * 100,
        "max_drawdown": Decimal(str(max_dd * 100)),
        "sharpe_ratio": sharpe,
        "best_day": Decimal(str(best * 100)),
        "worst_day": Decimal(str(worst * 100)),
    }
