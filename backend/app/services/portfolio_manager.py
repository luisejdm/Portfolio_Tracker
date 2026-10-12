import json
import re
from pathlib import Path

PORTFOLIOS_DIR = Path(__file__).resolve().parents[2] / "portfolios"
ACTIVE_FILE = PORTFOLIOS_DIR / "active.json"


def ensure_dir():
    PORTFOLIOS_DIR.mkdir(exist_ok=True)


def get_active() -> str:
    ensure_dir()
    if ACTIVE_FILE.exists():
        try:
            return json.loads(ACTIVE_FILE.read_text()).get("active", "default")
        except Exception:
            pass
    return "default"


def set_active(name: str):
    ensure_dir()
    ACTIVE_FILE.write_text(json.dumps({"active": name}))


def list_portfolios() -> list[str]:
    ensure_dir()
    return sorted(f.stem for f in PORTFOLIOS_DIR.glob("*.db"))


def get_db_path(name: str) -> Path:
    ensure_dir()
    return PORTFOLIOS_DIR / f"{name}.db"


def portfolio_exists(name: str) -> bool:
    return get_db_path(name).exists()


def is_valid_name(name: str) -> bool:
    return bool(re.match(r'^[a-zA-Z0-9_-]{1,40}$', name))


def delete_portfolio(name: str):
    path = get_db_path(name)
    if path.exists():
        path.unlink()
