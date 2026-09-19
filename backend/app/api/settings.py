from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.allocation_rule import AllocationRule
from app.models.user import User
from app.schemas.schemas import AllocationRuleOut, AllocationRuleUpdate
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["settings"])


async def _get_or_create_rules(user_id: int, db: AsyncSession) -> AllocationRule:
    result = await db.execute(select(AllocationRule).where(AllocationRule.user_id == user_id))
    rules = result.scalar_one_or_none()
    if not rules:
        rules = AllocationRule(user_id=user_id)
        db.add(rules)
        await db.flush()
    return rules


@router.get("/allocation-rules", response_model=AllocationRuleOut)
async def get_allocation_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await _get_or_create_rules(current_user.id, db)


@router.put("/allocation-rules", response_model=AllocationRuleOut)
async def update_allocation_rules(
    data: AllocationRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rules = await _get_or_create_rules(current_user.id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(rules, field, value)
    await db.flush()
    return rules
