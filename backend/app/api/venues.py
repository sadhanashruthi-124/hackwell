from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database.database import get_db
from app.models.venue import Venue
from app.models.user import User
from app.schemas.schemas import VenueOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/venues", tags=["venues"])


@router.get("", response_model=List[VenueOut])
async def list_venues(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Venue).order_by(Venue.capacity.desc()))
    return result.scalars().all()
