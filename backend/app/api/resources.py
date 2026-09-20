from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database.database import get_db
from app.models.resource import Resource
from app.models.user import User
from app.schemas.schemas import ResourceCreate, ResourceOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("", response_model=List[ResourceOut])
async def list_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).order_by(Resource.resource_type))
    resources = result.scalars().all()
    out = []
    for r in resources:
        used = r.total_quantity - r.available_quantity
        pct = round((used / r.total_quantity) * 100, 1) if r.total_quantity > 0 else 0
        obj = ResourceOut.model_validate(r)
        obj.utilization_pct = pct
        out.append(obj)
    return out


@router.post("", response_model=ResourceOut, status_code=201)
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = Resource(**data.model_dump())
    db.add(resource)
    await db.flush()
    return resource


@router.put("/{resource_id}", response_model=ResourceOut)
async def update_resource(
    resource_id: int,
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(resource, field, value)
    
    await db.flush()
    used = resource.total_quantity - resource.available_quantity
    pct = round((used / resource.total_quantity) * 100, 1) if resource.total_quantity > 0 else 0
    obj = ResourceOut.model_validate(resource)
    obj.utilization_pct = pct
    return obj


@router.delete("/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    await db.delete(resource)



@router.get("/estimate/{event_id}")
async def estimate_resources(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Estimate resource demand based on predicted attendance for an event."""
    from app.models.event import Event
    from app.services.resource_service import estimate_demand
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Use predicted attendance if plan exists, else registrations
    attendance = event.registrations
    if event.plan:
        attendance = event.plan.predicted_attendance

    demand = estimate_demand(attendance, event.duration_hours, event.event_type.value)
    return {"event_id": event_id, "estimated_attendance": attendance, "demand": demand}
