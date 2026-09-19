from typing import Optional
from sqlalchemy import String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base


class AllocationRule(Base):
    """Configurable allocation rules per user (Settings page)."""
    __tablename__ = "allocation_rules"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)

    # Resource ratios
    computers_per_participant: Mapped[float] = mapped_column(Float, default=1.0)
    chairs_per_participant: Mapped[float] = mapped_column(Float, default=1.05)
    projectors_per_n_participants: Mapped[int] = mapped_column(Integer, default=50)
    buses_per_n_participants: Mapped[int] = mapped_column(Integer, default=112)

    # Minimums
    min_computers: Mapped[int] = mapped_column(Integer, default=10)
    min_chairs: Mapped[int] = mapped_column(Integer, default=20)
    min_projectors: Mapped[int] = mapped_column(Integer, default=1)
    min_buses: Mapped[int] = mapped_column(Integer, default=1)
