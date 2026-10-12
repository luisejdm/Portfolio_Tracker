# Portfolio Tracker — Coding Agent Context

## Project Overview

A local, single-user investment portfolio dashboard for tracking stock and ETF positions in the Mexican (BMV) and American (NYSE/NASDAQ) markets, accessible via a browser at `localhost`. The user trades through GBM broker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 18 + TypeScript, Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | react-plotly.js (ALL plots must use Plotly — no exceptions) |
| Market Data | yfinance (free, ~15 min delay) |
| Exchange Rate | Banxico SIE REST API (free, requires token in .env) |
| State | TanStack Query (server state) + Zustand (UI state: theme, currency) |
| Routing | React Router v6 |

---

## Project Structure

```
portfolio-tracker/
├── CLAUDE.md
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── schemas.py
│   │   ├── routers/
│   │   │   ├── transactions.py
│   │   │   ├── portfolio.py
│   │   │   ├── market_data.py
│   │   │   └── settings.py
│   │   └── services/
│   │       ├── portfolio_calculator.py
│   │       ├── market_data.py
│   │       └── banxico.py
│   ├── requirements.txt
│   ├── .env
│   └── portfolio.db          # auto-created on first run
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── main.tsx
    │   ├── index.css
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── TopNav.tsx
    │   │   │   └── SettingsPanel.tsx
    │   │   ├── dashboard/
    │   │   │   ├── KPICards.tsx
    │   │   │   ├── CompositionChart.tsx
    │   │   │   └── PositionsTable.tsx
    │   │   ├── performance/
    │   │   │   ├── PortfolioValueChart.tsx
    │   │   │   ├── TWRChart.tsx
    │   │   │   └── RiskMetricsCards.tsx
    │   │   ├── transactions/
    │   │   │   ├── TransactionTable.tsx
    │   │   │   └── TransactionForm.tsx
    │   │   └── explorer/
    │   │       ├── TickerSearch.tsx
    │   │       └── PriceHistoryChart.tsx
    │   ├── pages/
    │   │   ├── Dashboard.tsx
    │   │   ├── Performance.tsx
    │   │   ├── Transactions.tsx
    │   │   └── Explorer.tsx
    │   ├── hooks/
    │   │   ├── usePortfolio.ts
    │   │   ├── useTransactions.ts
    │   │   └── useMarketData.ts
    │   ├── store/
    │   │   └── uiStore.ts       # Zustand: theme, accentColor, displayCurrency
    │   ├── lib/
    │   │   ├── api.ts           # axios instance pointing to backend
    │   │   └── utils.ts         # formatCurrency, formatPct helpers
    │   └── types/
    │       └── index.ts
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Database Models (SQLAlchemy + SQLite)

### `transactions`
```
id              INTEGER PRIMARY KEY AUTOINCREMENT
ticker          VARCHAR NOT NULL          -- e.g. "AAPL", "AMXL.MX"
type            VARCHAR NOT NULL          -- "buy" | "sell"
date            DATE NOT NULL
shares          DECIMAL(18,8) NOT NULL    -- supports fractional shares
price_per_share DECIMAL(18,8) NOT NULL    -- in the asset's native currency
currency        VARCHAR(3) NOT NULL       -- "MXN" | "USD" (auto-detected from ticker)
commission_pct  DECIMAL(8,4) NOT NULL DEFAULT 0  -- e.g. 0.25 means 0.25%
notes           TEXT                      -- nullable, reserved for future use
created_at      DATETIME DEFAULT now()
updated_at      DATETIME DEFAULT now()
```

### `price_cache`
```
id              INTEGER PRIMARY KEY AUTOINCREMENT
ticker          VARCHAR NOT NULL
date            DATE NOT NULL
close_price     DECIMAL(18,8) NOT NULL
currency        VARCHAR(3) NOT NULL
fetched_at      DATETIME DEFAULT now()
UNIQUE(ticker, date)
```

### `dividends` *(table exists but is empty — reserved for future use)*
```
id              INTEGER PRIMARY KEY AUTOINCREMENT
ticker          VARCHAR NOT NULL
date            DATE NOT NULL
amount_per_share DECIMAL(18,8) NOT NULL
currency        VARCHAR(3) NOT NULL
created_at      DATETIME DEFAULT now()
```

> **Important:** Use Alembic for migrations so the schema can evolve cleanly.

---

## Currency & Exchange Rate Logic

- BMV tickers end in `.MX` → currency = `MXN`
- All other tickers → currency = `USD`
- Currency is auto-detected when the user types the ticker in the transaction form
- Exchange rate source: **Banxico SIE API** — series `SF43718` (USD/MXN FIX)
  - Endpoint: `https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno`
  - Requires `Bmx-Token` header with the token from `.env`
- The frontend has a **currency toggle** (MXN ↔ USD) stored in Zustand
- When converting, all MXN values ÷ exchange_rate = USD; all USD × exchange_rate = MXN
- There is also a filter to show **only MXN positions** or **only USD positions**

---

## API Endpoints (FastAPI)

### Transactions — `/api/transactions`
```
GET    /api/transactions              → list all, ordered by date desc
POST   /api/transactions              → create new transaction
PUT    /api/transactions/{id}         → update transaction
DELETE /api/transactions/{id}         → delete transaction
```

### Portfolio — `/api/portfolio`
```
GET /api/portfolio/summary            → KPI cards data
GET /api/portfolio/positions          → positions table data
GET /api/portfolio/composition        → pie chart data (ticker, value, pct)
GET /api/portfolio/performance        → time-series for Performance page
GET /api/portfolio/risk-metrics       → volatility, max drawdown, sharpe, TWR
```

### Market Data — `/api/market`
```
GET /api/market/refresh               → fetch & cache current prices for all holdings
GET /api/market/price/{ticker}        → latest price for a ticker
GET /api/market/history/{ticker}      → historical OHLCV, query param: range=1w|1m|3m|6m|ytd|1y|2y|5y|max
GET /api/exchange-rate                → current MXN/USD rate from Banxico
```

### Settings — `/api/settings`
> Settings (theme, accent color) are stored in **localStorage** on the frontend.
> This endpoint only handles backend-relevant settings if needed in the future.
> For now, no settings endpoint is required — omit it.

---

## Portfolio Calculation Logic

All calculations live in `backend/app/services/portfolio_calculator.py`.

### Cost Basis Method: Weighted Average Cost (Costo Promedio Ponderado)

For each ticker, across all **buy** transactions:
```
effective_price_i = price_per_share_i × (1 + commission_pct_i / 100)
total_cost        = Σ(shares_i × effective_price_i)
total_shares_bought = Σ shares_i
weighted_avg_cost = total_cost / total_shares_bought
```

### Current Positions
For each ticker:
- `shares_held = total_shares_bought - total_shares_sold`
- If `shares_held ≈ 0`, the position is **closed**
- `invested_amount = shares_held × weighted_avg_cost`  (in native currency)
- `current_value = shares_held × current_market_price`
- `unrealized_pnl = current_value - invested_amount`
- `unrealized_pnl_pct = unrealized_pnl / invested_amount × 100`

### Realized P&L (for sell transactions)
For each sell transaction:
```
net_sell_price = price_per_share × (1 - commission_pct/100)
realized_pnl_i = (net_sell_price - weighted_avg_cost_at_time_of_sell) × shares_sold
```
`total_realized_pnl = Σ realized_pnl_i`

### Portfolio KPIs
- `total_current_value` = Σ(current_value per position, converted to display currency)
- `total_invested` = Σ(invested_amount per position, converted to display currency) + closed positions cost
- `total_unrealized_pnl` = Σ unrealized_pnl (in display currency)
- `total_realized_pnl` = Σ realized_pnl (in display currency)
- `total_pnl` = unrealized + realized
- `total_return_pct` = total_pnl / total_invested × 100

### Time-Weighted Return (TWR)
Used in the Performance page to measure portfolio return independent of cash flows (contributions/withdrawals do not inflate/deflate the metric).

Algorithm:
1. Collect all transaction dates as sub-period boundaries
2. For each sub-period [t_i, t_{i+1}]:
   - `value_start` = portfolio value at start of sub-period (using historical prices from yfinance)
   - `value_end` = portfolio value at end of sub-period (before applying next cash flow)
   - `sub_period_return = value_end / value_start - 1`
3. `TWR = Π(1 + sub_period_return_i) - 1`

Fetch historical daily close prices from yfinance for all tickers to compute this. Cache results in `price_cache`.

### Risk Metrics (Performance Page)
Compute from the daily portfolio value time-series:
- **Annualized Volatility**: `std(daily_returns) × sqrt(252)`
- **Max Drawdown**: `max((peak - trough) / peak)` over all rolling windows
- **Sharpe Ratio**: `(annualized_return - risk_free_rate) / annualized_volatility`
  - Use `risk_free_rate = 0.04` (4% annual, approximate CETES rate — hardcoded constant)
- **Best / Worst single day**: max and min daily return

---

## Feature Specifications by Page

### 1. Dashboard (`/`)

**KPI Cards (top row):**
- Portfolio Current Value (in display currency)
- Total Contributed Capital
- Unrealized P&L ($ and %)  — green if positive, red if negative
- Realized P&L ($ and %) — green if positive, red if negative
- Total Return %

**Composition Chart:**
- Plotly pie chart showing % of portfolio by position (by current value)
- Hovering shows: ticker, value, percentage
- Legend below or to the right

**Positions Table (below chart):**

| Column | Description |
|---|---|
| Ticker | Symbol |
| Shares | Shares held |
| Avg Cost | Weighted avg cost per share (native currency) |
| Invested | Total invested in this position (display currency) |
| Market Price | Latest price from yfinance (native currency) |
| Current Value | shares × market price (display currency) |
| Unrealized P&L | $ and % — colored red/green |
| Portfolio % | % of total portfolio value |

- Refresh button in the top-right of the page that calls `/api/market/refresh`
- Prices auto-fetch on page load
- Currency toggle (MXN | USD) at the top affects all monetary values
- Filter buttons: All | MXN | USD to filter positions by currency

### 2. Performance (`/performance`)

**Portfolio Value Chart:**
- Plotly line chart: x = date, y = total portfolio value (in display currency)
- Time range selector: 1M | 3M | 6M | YTD | 1Y | 2Y | MAX
- Computed from transaction history + historical prices via yfinance

**TWR Chart:**
- Plotly line chart: x = date, y = cumulative TWR (%)
- Same time range selector as above
- Annotations at major cash flow events (contributions/withdrawals)

**Risk Metrics Cards:**
- Annualized Volatility
- Max Drawdown
- Sharpe Ratio
- Best Day / Worst Day

### 3. Transactions (`/transactions`)

**Transaction History Table:**

| Column |
|---|
| Date |
| Ticker |
| Type (Buy/Sell badge) |
| Shares |
| Price per Share |
| Currency |
| Commission % |
| Total Amount |
| Actions (Edit / Delete) |

- Sorted by date descending
- Edit opens a pre-filled modal form
- Delete asks for confirmation before removing

**Add Transaction Button:**
- Opens a modal/dialog with the transaction form
- Fields:
  1. Ticker (text input — auto-detects currency from `.MX` suffix)
  2. Type: Buy / Sell (toggle)
  3. Date (date picker, defaults to today)
  4. Shares (number)
  5. Price per Share (number, label shows currency)
  6. Commission % (number, default 0.25)
- On submit: POST to `/api/transactions`

### 4. Explorer (`/explorer`)

- Search input for ticker (e.g. `AAPL`, `AMXL.MX`)
- On search: fetch historical data via `/api/market/history/{ticker}?range=1y`
- **Plotly chart** — toggle between:
  - Line chart (close price)
  - Candlestick chart (OHLC)
- Time range buttons: 1W | 1M | 3M | 6M | YTD | 1Y | 2Y | 5Y | MAX
- Chart is interactive: zoom, pan, hover tooltips
- Show ticker name and current price above chart

### 5. Settings Panel (slide-out or modal, triggered by gear icon in top-right corner)

- **Theme**: Toggle Dark / Light mode
- **Accent Color**: Color picker with preset swatches + custom hex input (default `#4F89FF`)
- Changes apply immediately and persist in `localStorage`

---

## Design System

### Theme
- **Default**: Dark mode
- Dark background: `#0A0A0F` (near black)
- Card/surface: `#12121A`
- Border: `#1E1E2E`
- Text primary: `#F0F0F5`
- Text muted: `#6B6B80`
- Light mode: standard light bg `#FAFAFA`, cards `#FFFFFF`

### Accent Color
- Default: `#4F89FF`
- Applied via CSS custom property `--accent` so it can be changed at runtime
- Used for: active nav items, primary buttons, chart lines, badges

### Colors for P&L
- **Gain / Positive**: `#22C55E` (green-500)
- **Loss / Negative**: `#EF4444` (red-500)
- These are fixed regardless of accent color

### Typography
- Font: **Inter** (Google Fonts) — clean, friendly, readable
- Numbers: use **tabular-nums** CSS feature for aligned columns in tables

### Layout
- **Top Navigation Bar**: minimal height (~48px), app name/logo left, page links center, settings gear icon top-right
- No sidebar
- Content area: max-width 1400px, centered, padding 24px

### Plotly Chart Theme
All charts must match the app theme. Apply these Plotly layout properties:
```json
{
  "paper_bgcolor": "transparent",
  "plot_bgcolor": "transparent",
  "font": { "family": "Inter", "color": "#F0F0F5" },
  "xaxis": { "gridcolor": "#1E1E2E", "zerolinecolor": "#1E1E2E" },
  "yaxis": { "gridcolor": "#1E1E2E", "zerolinecolor": "#1E1E2E" }
}
```
In light mode swap grid/text colors accordingly. Pass theme as a prop to chart components.

---

## External APIs

### yfinance
```python
import yfinance as yf

# Current price
ticker = yf.Ticker("AAPL")
info = ticker.fast_info
price = info.last_price

# Historical data
hist = ticker.history(period="1y")       # or period="max", "5y", etc.
hist = ticker.history(start="2023-01-01", end="2024-01-01")
# Returns DataFrame with columns: Open, High, Low, Close, Volume
```
- BMV tickers use `.MX` suffix: `AMXL.MX`, `WALMEX.MX`, `FUNO11.MX`
- Rate limit: do not hammer the API; cache results in `price_cache` table

### Banxico SIE API
```
GET https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno
Headers: Bmx-Token: <BANXICO_TOKEN>
```
Response JSON path: `bmx.series[0].datos[0].dato` → exchange rate string (e.g. `"17.2345"`)

Token is free — user must register at https://www.banxico.org.mx/SieAPIRest/service/v1/token and set `BANXICO_TOKEN` in `backend/.env`.

---

## Environment Variables

`backend/.env`:
```
BANXICO_TOKEN=your_token_here
```

---

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- pip

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env       # then add your BANXICO_TOKEN
alembic upgrade head          # creates portfolio.db with schema
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                   # starts at http://localhost:5173
```

Backend runs on `http://localhost:8000`. Frontend proxies `/api` → backend via Vite config.

### CORS
Backend must allow `http://localhost:5173` in FastAPI CORS middleware.

---

## Implementation Notes & Constraints

1. **All monetary displays** must respect the active display currency (MXN or USD from Zustand store). Every component that shows money must subscribe to `useUIStore` and apply conversion using the exchange rate from TanStack Query cache.

2. **Red/Green rule**: any number representing P&L or return % must be colored `#22C55E` (positive) or `#EF4444` (negative). This includes KPI cards, table cells, and chart annotations.

3. **Loading states**: every data-fetching component must show a skeleton loader (shadcn `Skeleton`) while data loads, not a blank screen.

4. **Error states**: if yfinance fails to fetch a price, show the last cached price with a stale indicator, not an error crash.

5. **Plotly responsiveness**: all Plotly charts must use `useResizeObserver` or `config={{ responsive: true }}` to fill their container.

6. **Ticker normalization**: store tickers in uppercase. The `.MX` suffix is case-insensitive on input but always stored/passed as uppercase `.MX`.

7. **Price cache strategy**: on `/api/market/refresh`, fetch prices for all currently held tickers, store in `price_cache`. On page load, the frontend calls this endpoint once. Stale cache threshold: if `fetched_at` is older than 30 minutes, treat as stale.

8. **TWR computation is expensive**: compute lazily only when the Performance page is requested, and cache the result in memory (FastAPI lifespan cache) invalidated on any transaction mutation.

9. **Extensibility hooks** (do not implement, just architect for them):
   - `dividends` table already exists in schema
   - Transaction `notes` field exists for future annotation features
   - Watchlist page can be added as a new route without touching existing code

10. **Open-source readiness**: no hardcoded secrets, `.env` is gitignored, `.env.example` is committed, code is readable and modular.
