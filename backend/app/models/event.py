from datetime import datetime, date, time, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Date, Time, Integer, ForeignKey, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base
import enum


class EventStatus(str, enum.Enum):
    draft = "draft"
    planned = "planned"
    confirmed = "confirmed"
    conflict = "conflict"
    completed = "completed"
    cancelled = "cancelled"


class EventType(str, enum.Enum):
    hackathon = "hackathon"
    symposium = "symposium"
    cultural = "cultural"
    sports = "sports"
    workshop = "workshop"
    seminar = "seminar"
    conference = "conference"
    other = "other"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    event_type: Mapped[EventType] = mapped_column(SAEnum(EventType))
    date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    end_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    duration_hours: Mapped[int] = mapped_column(Integer, default=8)
    registrations: Mapped[int] = mapped_column(Integer, default=0)
    teams: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    expected_participants: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    venue_preference: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    alternative_venue: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    venue_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # indoor/outdoor
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[EventStatus] = mapped_column(SAEnum(EventStatus), default=EventStatus.draft)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # resource requirements (requested)
    req_computers: Mapped[int] = mapped_column(Integer, default=0)
    req_projectors: Mapped[int] = mapped_column(Integer, default=0)
    req_chairs: Mapped[int] = mapped_column(Integer, default=0)
    req_buses: Mapped[int] = mapped_column(Integer, default=0)
    req_other: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    allocations: Mapped[list["Allocation"]] = relationship(back_populates="event")
    plan: Mapped[Optional["EventPlan"]] = relationship(back_populates="event", uselist=False)
