from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.user import User, UserRole
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserOut, InstitutionSetupRequest
from app.core.security import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    raw_sub = payload.get("sub")
    try:
        user_id = int(raw_sub)
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        role=user.role.value,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        institution_name=data.institution_name or "",
        campus_name=data.campus_name or "",
        location=data.location or "",
        student_population=data.student_population or 0,
        role=UserRole.organizer,
    )
    db.add(user)
    await db.flush()
    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        role=user.role.value,
    )


@router.post("/setup-institution", response_model=UserOut)
async def setup_institution(
    data: InstitutionSetupRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.institution_name = data.institution_name
    current_user.campus_name = data.campus_name or ""
    current_user.location = data.location or ""
    current_user.student_population = data.student_population or 0
    current_user.onboarding_completed = True
    await db.flush()
    return current_user


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

