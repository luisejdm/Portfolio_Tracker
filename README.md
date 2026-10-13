<div align="center">
  <img src="assets/banner.svg" alt="Portfolio Tracker" width="600"/>

  <p>A self-hosted investment portfolio dashboard for the Mexican (BMV) and American (NYSE/NASDAQ) markets.</p>

  ![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
  ![SQLite](https://img.shields.io/badge/SQLite-local-003B57?logo=sqlite&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-22C55E)
</div>

---

## Features

- **Dashboard** — Portfolio value, contributed capital, unrealized/realized P&L, and total return KPIs. Donut composition chart, portfolio value over time chart, and open positions table with weighted average cost basis.
- **Explorer** — Search any ticker to view interactive price history (line or candlestick), analyst targets & recommendations, fundamentals, and company info. Company logos powered by Logo.dev.
- **Transactions** — Full transaction history with buy/sell tracking, commission support, and inline edit/delete.
- **Settings** — Dark/light theme, accent color picker, pie chart color palette toggle, and global font size slider.

## Screenshots

<div align="center">
  <img src="assets/dashboard.png" alt="Dashboard" width="100%"/>
  <p><em>Dashboard — portfolio value, P&L, and positions table</em></p>

  <img src="assets/explorer.png" alt="Explorer" width="100%"/>
  <p><em>Explorer — price history, analyst data, and fundamentals</em></p>

  <img src="assets/transactions.png" alt="Transactions" width="100%"/>
  <p><em>Transactions — full history with edit and delete</em></p>
</div>

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, SQLAlchemy, SQLite |
| Frontend | React 19 + TypeScript, Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Charts | react-plotly.js |
| Market Data | yfinance (free, ~15 min delay) |
| Exchange Rate | Banxico SIE REST API |
| State | TanStack Query v5 + Zustand v5 |
| Routing | React Router v7 |

## Prerequisites

- Python 3.11+
- Node.js 18+
- A free [Banxico SIE API token](https://www.banxico.org.mx/SieAPIRest/service/v1/token)
- A free [Logo.dev](https://logo.dev) CDN publishable key (optional — for company logos in Explorer)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/luisejdm/portfolio-tracker.git
cd portfolio-tracker
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env         # then add your BANXICO_TOKEN
alembic upgrade head            # creates portfolio.db
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env            # then add your VITE_LOGO_DEV_TOKEN
```

### 4. Run

From the project root:

```bash
npm install
npm run dev
```

This starts both the backend (port 8000) and frontend (port 5173) concurrently. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Environment Variables

**`backend/.env`**
```
BANXICO_TOKEN=your_token_here
```

**`frontend/.env`**
```
VITE_LOGO_DEV_TOKEN=pk_your_token_here
```

## Usage

### Log your first transaction

Go to **Transactions** and click **Add Transaction**. Fill in:
- **Ticker** — e.g. `AAPL` for NYSE/NASDAQ or `BIMBOA.MX` for BMV. Currency is auto-detected from the `.MX` suffix.
- **Type** — Buy or Sell.
- **Date**, **Shares**, **Price per Share**, and **Commission %** (default 0.25%).

Submit and the position will appear immediately on the Dashboard.

### Dashboard

The top row shows your portfolio KPIs: current value, contributed capital, unrealized P&L, realized P&L, and total return. Use the **MXN / USD toggle** at the top to switch the display currency — all values convert in real time using the live Banxico exchange rate. Use the **All / MXN / USD filter** to narrow the positions table by market. Hit **Refresh** to pull the latest prices from yfinance.

### Explorer

Type any ticker in the search box and press Enter. Toggle between **Line** and **Candlestick** chart, pick a time range, and hover for exact OHLCV values. Scroll down for analyst price targets, buy/hold/sell recommendations, and key fundamentals (P/E, EPS, market cap, etc.).

### Edit or delete a transaction

In the Transactions table, click the **edit icon** on any row to update it in a pre-filled form, or the **trash icon** to delete it (a confirmation dialog appears before anything is removed).

### Settings

Click the **gear icon** (top-right) to open the settings panel. You can switch between dark and light mode, change the accent color using the swatches or a custom hex value, adjust the global font size, and pick a different color palette for the composition pie chart. All changes are instant and persist in `localStorage`.

## Currency Support

- Tickers ending in `.MX` are treated as **MXN** (BMV)
- All other tickers are treated as **USD** (NYSE/NASDAQ)
- Live USD/MXN exchange rate fetched from Banxico SIE API
- Toggle between MXN and USD display across the entire dashboard

## Cost Basis Method

Uses **Weighted Average Cost** (Costo Promedio Ponderado). Commission percentages are factored into the cost basis and P&L calculations automatically.

## Limitations

- **Long positions only** — short selling is not supported.
- Market data has an ~15 min delay via yfinance (free tier).

## License

[MIT](LICENSE)
