import asyncio
import sys
from datetime import date, time, datetime, timezone

sys.path.insert(0, ".")

from app.database.database import AsyncSessionLocal, engine, Base
from app.models import *

async def init_clean_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] All tables created successfully with strict empty state.")

if __name__ == "__main__":
    asyncio.run(init_clean_db())
