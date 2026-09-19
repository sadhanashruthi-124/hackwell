from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Integer, ForeignKey, String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base


class EventPlan(Base):
    __tablename__ = "event_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), unique=True)
    predicted_attendance: Mapped[int] = mapped_column(Integer)
    confidence_low: Mapped[int] = mapped_column(Integer)
    confidence_high: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), default="generated")  # generated / confirmed
    plan_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # full allocation JSON
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    event: Mapped["Event"] = relationship(back_populates="plan")
