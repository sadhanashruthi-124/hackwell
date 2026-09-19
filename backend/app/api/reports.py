from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io

from app.database.database import get_db
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.user import User
from app.api.auth import get_current_user
from app.services.report_service import generate_pdf, generate_excel

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/{event_id}/pdf")
async def export_pdf(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event, plan = await _get_event_and_plan(event_id, db)
    pdf_bytes = generate_pdf(event, plan)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="event_{event_id}_plan.pdf"'},
    )


@router.post("/{event_id}/excel")
async def export_excel(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event, plan = await _get_event_and_plan(event_id, db)
    xlsx_bytes = generate_excel(event, plan)
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="event_{event_id}_plan.xlsx"'},
    )


async def _get_event_and_plan(event_id: int, db: AsyncSession):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    plan_result = await db.execute(select(EventPlan).where(EventPlan.event_id == event_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="No plan generated yet. Run optimization first.")

    return event, plan
