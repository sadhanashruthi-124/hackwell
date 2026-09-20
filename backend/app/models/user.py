from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base
import enum


class UserRole(str, enum.Enum):
    organizer = "organizer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.organizer)
    
    # Institution details
    institution_name: Mapped[str] = mapped_column(String(200), default="", nullable=True)
    campus_name: Mapped[str] = mapped_column(String(200), default="", nullable=True)
    location: Mapped[str] = mapped_column(String(200), default="", nullable=True)
    student_population: Mapped[int] = mapped_column(default=0, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
