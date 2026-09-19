from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database.database import get_db
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.historical_event import HistoricalEvent
from app.models.user import User
from app.schemas.schemas import PredictionOut
from app.api.auth import get_current_user
from app.ml.attendance_model import predict, MIN_HISTORICAL_EVENTS

router = APIRouter(prefix="/api/predictions", tags=["predictions"])


async def _get_historical_records(user_id: int, event_type: str, db: AsyncSession) -> list[dict]:
    """Fetch all user's historical records (optionally filtered by type for relevance)."""
    result = await db.execute(
        select(HistoricalEvent)
        .where(HistoricalEvent.user_id == user_id)
        .order_by(HistoricalEvent.event_date.desc())
    )
    rows = result.scalars().all()
    return [
        {
            "event_type": r.event_type,
            "registrations": r.registrations,
            "teams": r.teams or 0,
            "duration_hours": r.duration_hours,
            "attendance": r.attendance,
            "venue_type": r.venue_type,
            "day_of_week": r.day_of_week,
            "month": r.month,
        }
        for r in rows
    ]


@router.post("/{event_id}", response_model=PredictionOut)
async def run_prediction(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Event).where(
        Event.id == event_id,
        Event.created_by == current_user.id,
    ))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Count historical records
    count_result = await db.execute(
        select(func.count()).select_from(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
    )
    historical_count = count_result.scalar()

    if historical_count < MIN_HISTORICAL_EVENTS:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "insufficient_data",
                "message": f"Not enough historical data for prediction. You have {historical_count} record(s). Minimum required: {MIN_HISTORICAL_EVENTS}.",
                "historical_count": historical_count,
                "minimum_required": MIN_HISTORICAL_EVENTS,
            }
        )

    # Fetch actual user historical records for model training
    historical_records = await _get_historical_records(current_user.id, event.event_type.value, db)

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
        historical_records=historical_records,
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
        historical_events_used=prediction["historical_events_used"],
        model_source=prediction["model_source"],
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

    event_result = await db.execute(select(Event).where(
        Event.id == event_id,
        Event.created_by == current_user.id,
    ))
    event = event_result.scalar_one_or_none()

    # Count historical records for display
    count_result = await db.execute(
        select(func.count()).select_from(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
    )
    historical_count = count_result.scalar()

    return {
        "event_id": event_id,
        "predicted_attendance": plan.predicted_attendance,
        "confidence_low": plan.confidence_low,
        "confidence_high": plan.confidence_high,
        "historical_events_used": historical_count,
        "model_source": "user_data" if historical_count >= MIN_HISTORICAL_EVENTS else "base_model",
        "generated_at": plan.generated_at,
        "input_features": {
            "event_type": event.event_type.value if event else "unknown",
            "registrations": event.registrations if event else 0,
            "teams": event.teams or 0 if event else 0,
            "duration_hours": event.duration_hours if event else 0,
        },
    }
