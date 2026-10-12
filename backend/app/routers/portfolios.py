from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import portfolio_manager
from app.database import init_db

router = APIRouter(tags=["portfolios"])


class PortfolioCreate(BaseModel):
    name: str


class PortfolioSwitch(BaseModel):
    name: str


@router.get("/api/portfolios")
def list_portfolios():
    return {
        "portfolios": portfolio_manager.list_portfolios(),
        "active": portfolio_manager.get_active(),
    }


@router.post("/api/portfolios", status_code=201)
def create_portfolio(body: PortfolioCreate):
    name = body.name.strip()
    if not portfolio_manager.is_valid_name(name):
        raise HTTPException(400, "Name must be 1-40 characters: letters, numbers, hyphens, underscores only")
    if portfolio_manager.portfolio_exists(name):
        raise HTTPException(409, f"Portfolio '{name}' already exists")
    init_db(name)
    return {"name": name}


@router.put("/api/portfolios/active")
def switch_portfolio(body: PortfolioSwitch):
    if not portfolio_manager.portfolio_exists(body.name):
        raise HTTPException(404, f"Portfolio '{body.name}' not found")
    portfolio_manager.set_active(body.name)
    return {"active": body.name}


@router.delete("/api/portfolios/{name}")
def delete_portfolio(name: str):
    portfolios = portfolio_manager.list_portfolios()
    if len(portfolios) <= 1:
        raise HTTPException(400, "Cannot delete the only portfolio")
    if not portfolio_manager.portfolio_exists(name):
        raise HTTPException(404, f"Portfolio '{name}' not found")
    portfolio_manager.delete_portfolio(name)
    if portfolio_manager.get_active() == name:
        remaining = [p for p in portfolios if p != name]
        portfolio_manager.set_active(remaining[0])
    return {"deleted": name}
