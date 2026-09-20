from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    role: str


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    institution_name: Optional[str] = ""
    campus_name: Optional[str] = ""
    location: Optional[str] = ""
    student_population: Optional[int] = 0
    role: str = "organizer"


class InstitutionSetupRequest(BaseModel):
    institution_name: str
    campus_name: Optional[str] = ""
    location: Optional[str] = ""
    student_population: Optional[int] = 0


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    institution_name: Optional[str] = None
    campus_name: Optional[str] = None
    location: Optional[str] = None
    student_population: Optional[int] = None
    onboarding_completed: bool = False
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ── Historical Events ─────────────────────────────────────────────────────────

class HistoricalEventCreate(BaseModel):
    event_name: Optional[str] = None
    event_type: str
    event_date: date
    registrations: int
    teams: Optional[int] = None
    duration_hours: int = 8
    attendance: int
    venue_type: str = "indoor"


class HistoricalEventUpdate(BaseModel):
    event_name: Optional[str] = None
    event_type: Optional[str] = None
    event_date: Optional[date] = None
    registrations: Optional[int] = None
    teams: Optional[int] = None
    duration_hours: Optional[int] = None
    attendance: Optional[int] = None
    venue_type: Optional[str] = None


class HistoricalEventOut(BaseModel):
    id: int
    event_name: Optional[str] = None
    event_type: str
    event_date: date
    registrations: int
    teams: Optional[int] = None
    duration_hours: int
    attendance: int
    venue_type: str
    day_of_week: int
    month: int
    attendance_rate: float

    model_config = {"from_attributes": True}


# ── Events ────────────────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    name: str
    event_type: str
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_hours: int = 8
    registrations: int
    teams: Optional[int] = None
    expected_participants: Optional[int] = None
    venue_preference: Optional[str] = None
    alternative_venue: Optional[str] = None
    venue_type: Optional[str] = None
    notes: Optional[str] = None
    req_computers: int = 0
    req_projectors: int = 0
    req_chairs: int = 0
    req_buses: int = 0
    req_other: Optional[str] = None


class EventUpdate(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_hours: Optional[int] = None
    registrations: Optional[int] = None
    teams: Optional[int] = None
    expected_participants: Optional[int] = None
    venue_preference: Optional[str] = None
    alternative_venue: Optional[str] = None
    venue_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    req_computers: Optional[int] = None
    req_projectors: Optional[int] = None
    req_chairs: Optional[int] = None
    req_buses: Optional[int] = None
    req_other: Optional[str] = None


class EventOut(BaseModel):
    id: int
    name: str
    event_type: str
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_hours: int
    registrations: int
    teams: Optional[int] = None
    expected_participants: Optional[int] = None
    venue_preference: Optional[str] = None
    alternative_venue: Optional[str] = None
    venue_type: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_by: int
    req_computers: int
    req_projectors: int
    req_chairs: int
    req_buses: int
    req_other: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Resources ─────────────────────────────────────────────────────────────────

class ResourceCreate(BaseModel):
    resource_type: str
    name: str
    total_quantity: int
    available_quantity: int
    location: str = "Main Campus"
    status: str = "available"


class ResourceOut(BaseModel):
    id: int
    resource_type: str
    name: str
    total_quantity: int
    available_quantity: int
    location: str
    status: str
    utilization_pct: Optional[float] = None

    model_config = {"from_attributes": True}


# ── Venues ────────────────────────────────────────────────────────────────────

class VenueOut(BaseModel):
    id: int
    name: str
    capacity: int
    location: str
    venue_type: str
    available: bool
    description: str

    model_config = {"from_attributes": True}


# ── Predictions ───────────────────────────────────────────────────────────────

class PredictionOut(BaseModel):
    event_id: int
    predicted_attendance: int
    confidence_low: int
    confidence_high: int
    input_features: dict


# ── Optimization ──────────────────────────────────────────────────────────────

class OptimizationOut(BaseModel):
    event_id: int
    predicted_attendance: int
    venues: list[dict]
    resource_allocation: list[dict]
    alerts: list[dict]
    recommendations: list[str]
    transport_schedule: list[dict]
    timeline: list[dict]
    status: str  # "ok" | "conflict" | "shortage"
