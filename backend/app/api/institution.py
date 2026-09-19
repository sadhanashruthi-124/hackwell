from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.institution import Institution
from app.models.user import User
from app.schemas.schemas import InstitutionCreate, InstitutionOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/institution", tags=["institution"])


@router.get("", response_model=InstitutionOut)
async def get_institution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Institution).where(Institution.user_id == current_user.id))
    institution = result.scalar_one_or_none()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not configured yet")
    return institution


@router.post("", response_model=InstitutionOut)
async def save_institution(
    data: InstitutionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Institution).where(Institution.user_id == current_user.id))
    institution = result.scalar_one_or_none()
    if institution:
        # Update existing
        institution.institution_name = data.institution_name
        institution.campus_name = data.campus_name
        institution.location = data.location
        institution.student_population = data.student_population
    else:
        institution = Institution(
            user_id=current_user.id,
            **data.model_dump(),
        )
        db.add(institution)
    await db.flush()
    return institution
