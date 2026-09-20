from datetime import date, datetime, timezone
from typing import Optional
from sqlalchemy import Integer, Float, String, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base


class HistoricalEvent(Base):
    __tablename__ = "historical_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    event_name: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100))
    registrations: Mapped[int] = mapped_column(Integer)
    teams: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_hours: Mapped[int] = mapped_column(Integer)
    attendance: Mapped[int] = mapped_column(Integer)
    venue_type: Mapped[str] = mapped_column(String(50), default="indoor")
    event_date: Mapped[date] = mapped_column(Date)
    day_of_week: Mapped[int] = mapped_column(Integer)  # 0=Mon ... 6=Sun
    month: Mapped[int] = mapped_column(Integer)
    attendance_rate: Mapped[float] = mapped_column(Float)  # attendance / registrations
    req_computers: Mapped[int] = mapped_column(Integer, default=0)
    req_projectors: Mapped[int] = mapped_column(Integer, default=0)
    req_chairs: Mapped[int] = mapped_column(Integer, default=0)
    req_buses: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
