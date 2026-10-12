import shutil
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services import portfolio_manager
from app.database import init_db
from app.routers import transactions, portfolio, market_data, portfolios
from app.routers.portfolio import _invalidate_perf_cache

# Migrate legacy portfolio.db → portfolios/default.db
_OLD_DB = Path(__file__).resolve().parents[1] / "portfolio.db"
if _OLD_DB.exists() and not portfolio_manager.portfolio_exists("default"):
    shutil.move(str(_OLD_DB), str(portfolio_manager.get_db_path("default")))

# Ensure at least one portfolio exists
if not portfolio_manager.list_portfolios():
    init_db("default")
    portfolio_manager.set_active("default")
else:
    active = portfolio_manager.get_active()
    # If the saved active portfolio was deleted, fall back to the first one
    if not portfolio_manager.portfolio_exists(active):
        active = portfolio_manager.list_portfolios()[0]
        portfolio_manager.set_active(active)
    init_db(active)

app = FastAPI(title="Portfolio Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(portfolio.router)
app.include_router(market_data.router)
app.include_router(portfolios.router)


@app.middleware("http")
async def invalidate_on_mutation(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/transactions") and request.method in ("POST", "PUT", "DELETE"):
        _invalidate_perf_cache()
    return response


@app.get("/health")
def health():
    return {"status": "ok"}
