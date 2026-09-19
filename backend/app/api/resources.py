from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database.database import get_db
from app.models.resource import Resource, ResourceStatus
from app.models.user import User
from app.schemas.schemas import ResourceCreate, ResourceUpdate, ResourceOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/resources", tags=["resources"])


def _to_out(r: Resource) -> ResourceOut:
    used = r.total_quantity - r.available_quantity
    pct = round((used / r.total_quantity) * 100, 1) if r.total_quantity > 0 else 0
    obj = ResourceOut.model_validate(r)
    obj.utilization_pct = pct
    return obj


@router.get("", response_model=List[ResourceOut])
async def list_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Resource)
        .where(Resource.user_id == current_user.id)
        .order_by(Resource.resource_type)
    )
    return [_to_out(r) for r in result.scalars().all()]


@router.post("", response_model=ResourceOut, status_code=201)
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = Resource(user_id=current_user.id, **data.model_dump())
    db.add(resource)
    await db.flush()
    return _to_out(resource)


@router.put("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: int,
    data: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).where(
        Resource.id == resource_id,
        Resource.user_id == current_user.id,
    ))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(resource, field, value)
    await db.flush()
    return _to_out(resource)


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).where(
        Resource.id == resource_id,
        Resource.user_id == current_user.id,
    ))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)
    await db.flush()


@router.get("/estimate/{event_id}")
async def estimate_resources(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estimate resource demand based on predicted attendance for an event."""
    from app.models.event import Event
    from app.models.allocation_rule import AllocationRule
    result = await db.execute(select(Event).where(
        Event.id == event_id,
        Event.created_by == current_user.id,
    ))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Use predicted attendance if plan exists, else registrations
    attendance = event.registrations
    if event.plan:
        attendance = event.plan.predicted_attendance

    # Get user's allocation rules
    rule_result = await db.execute(select(AllocationRule).where(AllocationRule.user_id == current_user.id))
    rules = rule_result.scalar_one_or_none()
    from app.services.resource_service import estimate_demand_with_rules
    demand = estimate_demand_with_rules(attendance, event.duration_hours, event.event_type.value, rules)
    return {"event_id": event_id, "estimated_attendance": attendance, "demand": demand}


@router.post("/load-sample")
async def load_sample_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Load sample resources for the current user. Only runs when explicitly triggered."""
    count_result = await db.execute(
        select(func.count()).select_from(Resource).where(Resource.user_id == current_user.id)
    )
    existing_count = count_result.scalar()

    sample_resources = [
        ("computers",    "Desktop Workstations",   650, 650, "Computer Labs"),
        ("projectors",   "HD Projectors",           20,  20, "AV Store"),
        ("chairs",       "Stackable Chairs",        800, 800, "Storage"),
        ("buses",        "Campus Buses",             8,   8, "Transport Yard"),
        ("screens",      "Projection Screens",       15,  15, "AV Store"),
        ("microphones",  "Wireless Microphones",     20,  20, "AV Store"),
    ]

    added = 0
    for rtype, name, total, avail, loc in sample_resources:
        resource = Resource(
            user_id=current_user.id,
            resource_type=rtype,
            name=name,
            total_quantity=total,
            available_quantity=avail,
            location=loc,
            status=ResourceStatus.available,
        )
        db.add(resource)
        added += 1

    await db.flush()
    return {
        "added": added,
        "existing_before": existing_count,
        "message": f"Loaded {added} sample resources.",
    }
