from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.historical_event import HistoricalEvent
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
async def list_history(
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(HistoricalEvent).order_by(HistoricalEvent.event_date.desc())
    if event_type:
        query = query.where(HistoricalEvent.event_type == event_type)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "event_type": r.event_type,
            "registrations": r.registrations,
            "teams": r.teams,
            "duration_hours": r.duration_hours,
            "attendance": r.attendance,
            "venue_type": r.venue_type,
            "event_date": r.event_date.isoformat(),
            "attendance_rate": r.attendance_rate,
        }
        for r in rows
    ]
