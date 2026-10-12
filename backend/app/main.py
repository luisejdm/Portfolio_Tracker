from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import transactions, portfolio, market_data
from app.routers.portfolio import _invalidate_perf_cache

Base.metadata.create_all(bind=engine)

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


# Invalidate TWR cache on any transaction mutation
@app.middleware("http")
async def invalidate_on_mutation(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/api/transactions") and request.method in ("POST", "PUT", "DELETE"):
        _invalidate_perf_cache()
    return response


@app.get("/health")
def health():
    return {"status": "ok"}
