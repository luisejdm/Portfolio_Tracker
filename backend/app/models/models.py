from sqlalchemy import Column, Integer, String, Date, DateTime, Numeric, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, nullable=False)
    type = Column(String, nullable=False)  # "buy" | "sell"
    date = Column(Date, nullable=False)
    shares = Column(Numeric(18, 8), nullable=False)
    price_per_share = Column(Numeric(18, 8), nullable=False)
    currency = Column(String(3), nullable=False)  # "MXN" | "USD"
    commission_pct = Column(Numeric(8, 4), nullable=False, default=0)
    tax_pct = Column(Numeric(8, 4), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class PriceCache(Base):
    __tablename__ = "price_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    close_price = Column(Numeric(18, 8), nullable=False)
    currency = Column(String(3), nullable=False)
    fetched_at = Column(DateTime, default=func.now())

    __table_args__ = (UniqueConstraint("ticker", "date", name="uq_ticker_date"),)


class Dividend(Base):
    __tablename__ = "dividends"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    amount_per_share = Column(Numeric(18, 8), nullable=False)
    currency = Column(String(3), nullable=False)
    created_at = Column(DateTime, default=func.now())
