from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.user import User
from app.schemas.schemas import PredictionOut
from app.api.auth import get_current_user
from app.ml.attendance_model import predict

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


@router.post("/{event_id}", response_model=PredictionOut)
async def run_prediction(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    day_of_week = event.date.weekday()
    month = event.date.month
    teams = event.teams or 0

    prediction = predict(
        event_type=event.event_type.value,
        registrations=event.registrations,
        teams=teams,
        duration_hours=event.duration_hours,
        day_of_week=day_of_week,
        month=month,
    )

    # Upsert event plan record
    plan_result = await db.execute(select(EventPlan).where(EventPlan.event_id == event_id))
    plan = plan_result.scalar_one_or_none()
    if plan:
        plan.predicted_attendance = prediction["predicted_attendance"]
        plan.confidence_low = prediction["confidence_low"]
        plan.confidence_high = prediction["confidence_high"]
    else:
        plan = EventPlan(
            event_id=event_id,
            predicted_attendance=prediction["predicted_attendance"],
            confidence_low=prediction["confidence_low"],
            confidence_high=prediction["confidence_high"],
        )
        db.add(plan)

    # Update event status to planned
    event.status = "planned"
    await db.flush()

    return PredictionOut(
        event_id=event_id,
        predicted_attendance=prediction["predicted_attendance"],
        confidence_low=prediction["confidence_low"],
        confidence_high=prediction["confidence_high"],
        input_features={
            "event_type": event.event_type.value,
            "registrations": event.registrations,
            "teams": teams,
            "duration_hours": event.duration_hours,
            "day_of_week": day_of_week,
            "month": month,
        },
    )


@router.get("/{event_id}")
async def get_prediction(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return cached prediction for an event."""
    plan_result = await db.execute(select(EventPlan).where(EventPlan.event_id == event_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="No prediction found. Run POST first.")

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()

    return {
        "event_id": event_id,
        "predicted_attendance": plan.predicted_attendance,
        "confidence_low": plan.confidence_low,
        "confidence_high": plan.confidence_high,
        "generated_at": plan.generated_at,
        "input_features": {
            "event_type": event.event_type.value if event else "unknown",
            "registrations": event.registrations if event else 0,
            "teams": event.teams or 0 if event else 0,
            "duration_hours": event.duration_hours if event else 0,
        },
    }
