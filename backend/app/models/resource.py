from sqlalchemy import String, Integer, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base
import enum


class ResourceStatus(str, enum.Enum):
    available = "available"
    maintenance = "maintenance"
    retired = "retired"


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    resource_type: Mapped[str] = mapped_column(String(100))  # computers, projectors, chairs, buses
    name: Mapped[str] = mapped_column(String(200))
    total_quantity: Mapped[int] = mapped_column(Integer, default=0)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    location: Mapped[str] = mapped_column(String(200), default="Main Campus")
    status: Mapped[ResourceStatus] = mapped_column(SAEnum(ResourceStatus), default=ResourceStatus.available)
