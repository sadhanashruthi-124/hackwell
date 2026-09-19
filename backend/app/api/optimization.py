from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.event import Event
from app.models.event_plan import EventPlan
from app.models.resource import Resource
from app.models.venue import Venue
from app.models.allocation import Allocation
from app.models.allocation_rule import AllocationRule
from app.models.historical_event import HistoricalEvent
from app.models.user import User
from app.schemas.schemas import OptimizationOut
from app.api.auth import get_current_user
from app.optimization.allocation_engine import run_allocation
from app.ml.attendance_model import predict, MIN_HISTORICAL_EVENTS
from sqlalchemy import func

router = APIRouter(prefix="/api/optimization", tags=["optimization"])


@router.post("/{event_id}", response_model=OptimizationOut)
async def run_optimization(
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

    # Get or generate prediction
    plan_result = await db.execute(select(EventPlan).where(EventPlan.event_id == event_id))
    plan = plan_result.scalar_one_or_none()

    if not plan:
        # Need to run prediction first — check historical data
        count_result = await db.execute(
            select(func.count()).select_from(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
        )
        historical_count = count_result.scalar()

        if historical_count < MIN_HISTORICAL_EVENTS:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "insufficient_data",
                    "message": f"Run attendance prediction first. You need at least {MIN_HISTORICAL_EVENTS} historical records (currently have {historical_count}).",
                    "historical_count": historical_count,
                    "minimum_required": MIN_HISTORICAL_EVENTS,
                }
            )

        # Fetch historical records
        hist_result = await db.execute(
            select(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
        )
        historical_records = [
            {
                "event_type": r.event_type,
                "registrations": r.registrations,
                "teams": r.teams or 0,
                "duration_hours": r.duration_hours,
                "attendance": r.attendance,
                "day_of_week": r.day_of_week,
                "month": r.month,
            }
            for r in hist_result.scalars().all()
        ]

        pred = predict(
            event_type=event.event_type.value,
            registrations=event.registrations,
            teams=event.teams or 0,
            duration_hours=event.duration_hours,
            day_of_week=event.date.weekday(),
            month=event.date.month,
            historical_records=historical_records,
        )
        plan = EventPlan(
            event_id=event_id,
            predicted_attendance=pred["predicted_attendance"],
            confidence_low=pred["confidence_low"],
            confidence_high=pred["confidence_high"],
        )
        db.add(plan)
        await db.flush()

    predicted_attendance = plan.predicted_attendance

    # Fetch user's resources grouped by type
    res_result = await db.execute(
        select(Resource).where(
            Resource.user_id == current_user.id,
            Resource.status == "available",
        )
    )
    resources = res_result.scalars().all()
    available_resources: dict[str, int] = {}
    for r in resources:
        rtype = r.resource_type.lower()
        available_resources[rtype] = available_resources.get(rtype, 0) + r.available_quantity

    # Fetch venues (venues are global / shared)
    venue_result = await db.execute(select(Venue))
    venues_db = venue_result.scalars().all()
    venues = [
        {"id": v.id, "name": v.name, "capacity": v.capacity, "venue_type": v.venue_type, "available": v.available}
        for v in venues_db
    ]

    # Get user's configurable allocation rules
    rule_result = await db.execute(select(AllocationRule).where(AllocationRule.user_id == current_user.id))
    rules = rule_result.scalar_one_or_none()

    # Build explicitly requested resources dict
    req_resources = {
        "computers": event.req_computers,
        "projectors": event.req_projectors,
        "chairs": event.req_chairs,
        "buses": event.req_buses,
    }

    result_plan = run_allocation(
        predicted_attendance=predicted_attendance,
        event_type=event.event_type.value,
        duration_hours=event.duration_hours,
        available_resources=available_resources,
        venues=venues,
        req_resources=req_resources,
        allocation_rules=rules,
    )

    # Persist allocations
    await db.execute(
        __import__("sqlalchemy", fromlist=["delete"]).delete(Allocation).where(Allocation.event_id == event_id)
    )
    for res_item in result_plan["resource_allocation"]:
        rtype = res_item["resource"]
        allocated_qty = res_item["allocated"]
        if allocated_qty > 0:
            matching = next((r for r in resources if r.resource_type.lower() == rtype), None)
            if matching:
                alloc = Allocation(
                    event_id=event_id,
                    resource_id=matching.id,
                    allocated_quantity=allocated_qty,
                )
                db.add(alloc)

    # Store plan data
    plan.plan_data = result_plan
    event.status = "conflict" if result_plan["status"] in ("conflict", "shortage") else "planned"
    await db.flush()

    return OptimizationOut(
        event_id=event_id,
        predicted_attendance=predicted_attendance,
        venues=result_plan["venues"],
        resource_allocation=result_plan["resource_allocation"],
        alerts=result_plan["alerts"],
        recommendations=result_plan["recommendations"],
        transport_schedule=result_plan["transport_schedule"],
        timeline=result_plan["timeline"],
        status=result_plan["status"],
    )


@router.get("/{event_id}", response_model=OptimizationOut)
async def get_optimization(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan_result = await db.execute(select(EventPlan).where(EventPlan.event_id == event_id))
    plan = plan_result.scalar_one_or_none()
    if not plan or not plan.plan_data:
        raise HTTPException(status_code=404, detail="No optimization plan found. Run POST first.")

    d = plan.plan_data
    return OptimizationOut(
        event_id=event_id,
        predicted_attendance=plan.predicted_attendance,
        venues=d.get("venues", []),
        resource_allocation=d.get("resource_allocation", []),
        alerts=d.get("alerts", []),
        recommendations=d.get("recommendations", []),
        transport_schedule=d.get("transport_schedule", []),
        timeline=d.get("timeline", []),
        status=d.get("status", "ok"),
    )
