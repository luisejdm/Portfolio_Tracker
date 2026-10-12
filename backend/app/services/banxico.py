import httpx
import os
from decimal import Decimal
from dotenv import load_dotenv

load_dotenv()

BANXICO_URL = (
    "https://www.banxico.org.mx/SieAPIRest/service/v1/series/SF43718/datos/oportuno"
)


async def get_exchange_rate() -> Decimal:
    token = os.getenv("BANXICO_TOKEN", "")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(BANXICO_URL, headers={"Bmx-Token": token})
        resp.raise_for_status()
        data = resp.json()
        rate_str = data["bmx"]["series"][0]["datos"][0]["dato"]
        return Decimal(rate_str)
