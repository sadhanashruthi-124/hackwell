from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import date, time, datetime, timezone

from app.database.database import get_db
from app.models.user import User
from app.models.venue import Venue
from app.models.resource import Resource, ResourceStatus
from app.models.event import Event, EventStatus, EventType
from app.models.historical_event import HistoricalEvent
from app.models.allocation import Allocation
from app.models.event_plan import EventPlan
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/sample-data", tags=["sample-data"])


@router.post("/load")
async def load_sample_dataset(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Explicitly populate the organizer's workspace with sample institutional data:
      - 7 venues
      - 6 inventory resources
      - 24 historical event records
      - 3 sample draft/planned events
    """
    # 1. Venues
    existing_v = await db.execute(select(Venue))
    if not existing_v.scalars().first():
        db.add_all([
            Venue(name="Main Auditorium", capacity=800, location="Central Campus", venue_type="indoor", available=True, description="Main hall with stage and AV setup"),
            Venue(name="Lab A", capacity=120, location="Science Block", venue_type="indoor", available=True, description="Computer lab with 120 workstations"),
            Venue(name="Lab B", capacity=100, location="Science Block", venue_type="indoor", available=True, description="Computer lab with 100 workstations"),
            Venue(name="Lab C", capacity=80, location="Engineering Block", venue_type="indoor", available=True, description="Computer lab — 80 seats"),
            Venue(name="Seminar Hall 1", capacity=250, location="Main Block", venue_type="indoor", available=True, description="AC seminar hall"),
            Venue(name="Outdoor Ground", capacity=2000, location="Campus Ground", venue_type="outdoor", available=True, description="Open ground for large events"),
            Venue(name="Mini Auditorium", capacity=400, location="Arts Block", venue_type="indoor", available=True, description="Secondary auditorium"),
        ])

    # 2. Resources
    existing_r = await db.execute(select(Resource))
    if not existing_r.scalars().first():
        db.add_all([
            Resource(resource_type="computers", name="Desktop Workstations", total_quantity=800, available_quantity=650, location="Labs", status=ResourceStatus.available),
            Resource(resource_type="projectors", name="HD Projectors", total_quantity=20, available_quantity=8, location="AV Store", status=ResourceStatus.available),
            Resource(resource_type="chairs", name="Stackable Chairs", total_quantity=1000, available_quantity=720, location="Storage", status=ResourceStatus.available),
            Resource(resource_type="buses", name="Campus Buses", total_quantity=10, available_quantity=6, location="Transport Yard", status=ResourceStatus.available),
            Resource(resource_type="screens", name="Projection Screens", total_quantity=15, available_quantity=12, location="AV Store", status=ResourceStatus.available),
            Resource(resource_type="microphones", name="Wireless Microphones", total_quantity=20, available_quantity=18, location="AV Store", status=ResourceStatus.available),
        ])

    # 3. Historical Events (24 records)
    existing_h = await db.execute(select(HistoricalEvent))
    if not existing_h.scalars().first():
        historical_records = [
            ("Annual Hackathon 2025", "hackathon", 800, 200, 24, 672, "indoor", date(2025, 10, 12), 6, 10, 672, 5, 680, 5),
            ("Spring Code Sprint 2025", "hackathon", 600, 150, 24, 498, "indoor", date(2025, 3, 15), 5, 3, 498, 4, 500, 4),
            ("Winter DevJam 2024", "hackathon", 500, 125, 20, 422, "indoor", date(2024, 11, 8), 4, 11, 422, 3, 430, 3),
            ("Mega Hackathon 2024", "hackathon", 1000, 250, 24, 820, "indoor", date(2024, 2, 20), 1, 2, 820, 6, 850, 7),
            ("Summer Hack 2025", "hackathon", 750, 188, 24, 630, "indoor", date(2025, 8, 5), 1, 8, 630, 4, 650, 5),
            ("AI Innovate Hackathon 2024", "hackathon", 900, 225, 24, 747, "indoor", date(2024, 5, 18), 5, 5, 747, 5, 760, 6),
            ("National Tech Symposium 2025", "symposium", 400, 0, 8, 352, "indoor", date(2025, 9, 20), 5, 9, 50, 2, 360, 3),
            ("Winter Symposium 2025", "symposium", 300, 0, 8, 270, "indoor", date(2025, 1, 14), 0, 1, 30, 2, 280, 2),
            ("Annual Tech Colloquium 2024", "symposium", 500, 0, 8, 437, "indoor", date(2024, 7, 10), 2, 7, 60, 3, 450, 4),
            ("Research Showcase 2025", "symposium", 450, 0, 16, 398, "indoor", date(2025, 4, 22), 1, 4, 50, 3, 410, 3),
            ("Annual Cultural Fest 2025", "cultural", 1200, 0, 8, 936, "outdoor", date(2025, 1, 26), 6, 1, 10, 4, 1000, 8),
            ("Winter Cultural Gala 2024", "cultural", 1500, 0, 10, 1200, "outdoor", date(2024, 12, 25), 3, 12, 10, 5, 1250, 10),
            ("Spring Music Fest 2025", "cultural", 900, 0, 6, 675, "outdoor", date(2025, 2, 14), 4, 2, 5, 2, 700, 6),
            ("Independence Day Celebrations 2024", "cultural", 1100, 0, 8, 847, "outdoor", date(2024, 8, 15), 3, 8, 5, 3, 900, 7),
            ("Inter-College Sports Meet 2025", "sports", 600, 40, 6, 408, "outdoor", date(2025, 9, 7), 6, 9, 5, 1, 450, 3),
            ("Summer Sports League 2024", "sports", 800, 50, 6, 544, "outdoor", date(2024, 6, 21), 5, 6, 5, 2, 600, 4),
            ("Cloud & DevOps Workshop 2025", "workshop", 150, 0, 4, 138, "indoor", date(2025, 7, 18), 4, 7, 138, 2, 150, 1),
            ("FullStack Development BootCamp", "workshop", 200, 0, 6, 182, "indoor", date(2025, 3, 28), 4, 3, 182, 2, 200, 1),
            ("Cybersecurity Hands-on Lab", "workshop", 120, 0, 4, 111, "indoor", date(2024, 10, 15), 1, 10, 111, 1, 120, 1),
            ("Guest Lecture Series: AI & Robotics", "seminar", 250, 0, 3, 235, "indoor", date(2025, 5, 10), 5, 5, 10, 2, 250, 2),
            ("Industry Leaders Colloquium", "seminar", 180, 0, 2, 170, "indoor", date(2025, 2, 28), 4, 2, 5, 1, 180, 1),
            ("International Science Conference", "conference", 350, 0, 16, 301, "indoor", date(2025, 6, 14), 5, 6, 30, 4, 320, 2),
            ("Global Education Summit", "conference", 500, 0, 24, 427, "indoor", date(2024, 9, 20), 4, 9, 50, 5, 450, 3),
            ("Robotics Challenge 2025", "hackathon", 650, 163, 18, 547, "indoor", date(2025, 7, 28), 0, 7, 547, 4, 560, 4),
        ]
        for name, et, regs, teams, dur, att, vt, ed, dow, month, comp, proj, chairs, buses in historical_records:
            db.add(HistoricalEvent(
                event_name=name,
                event_type=et,
                registrations=regs,
                teams=teams or None,
                duration_hours=dur,
                attendance=att,
                venue_type=vt,
                event_date=ed,
                day_of_week=dow,
                month=month,
                attendance_rate=round(att / regs, 3),
                req_computers=comp,
                req_projectors=proj,
                req_chairs=chairs,
                req_buses=buses,
            ))

    # 4. Sample Events
    existing_e = await db.execute(select(Event))
    if not existing_e.scalars().first():
        db.add_all([
            Event(
                name="Annual Hackathon 2026",
                event_type=EventType.hackathon,
                date=date(2026, 10, 12),
                start_time=time(9, 0),
                end_time=time(9, 0),
                duration_hours=24,
                registrations=800,
                teams=200,
                expected_participants=672,
                venue_preference="Main Auditorium",
                alternative_venue="Lab A",
                venue_type="indoor",
                req_computers=650,
                req_projectors=10,
                req_chairs=700,
                req_buses=6,
                status=EventStatus.draft,
                created_by=current_user.id,
            ),
            Event(
                name="Tech Symposium 2026",
                event_type=EventType.symposium,
                date=date(2026, 10, 18),
                start_time=time(9, 0),
                end_time=time(17, 0),
                duration_hours=8,
                registrations=400,
                teams=None,
                expected_participants=352,
                venue_preference="Seminar Hall 1",
                venue_type="indoor",
                req_computers=50,
                req_projectors=4,
                req_chairs=400,
                req_buses=2,
                status=EventStatus.planned,
                created_by=current_user.id,
            ),
            Event(
                name="Cultural Fest 2026",
                event_type=EventType.cultural,
                date=date(2026, 10, 24),
                start_time=time(10, 0),
                end_time=time(18, 0),
                duration_hours=8,
                registrations=1200,
                teams=None,
                expected_participants=936,
                venue_preference="Outdoor Ground",
                venue_type="outdoor",
                req_computers=10,
                req_projectors=6,
                req_chairs=1000,
                req_buses=8,
                status=EventStatus.conflict,
                created_by=current_user.id,
            ),
        ])

    # Mark user onboarding completed
    current_user.onboarding_completed = True
    if not current_user.institution_name:
        current_user.institution_name = "Global Institute of Technology"
        current_user.campus_name = "Main Campus"
        current_user.location = "Tech Park Avenue"
        current_user.student_population = 6500

    await db.commit()
    return {"status": "success", "message": "Sample dataset loaded successfully into your workspace."}


@router.delete("/clear")
async def clear_workspace(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reset workspace data back to empty state."""
    await db.execute(delete(Allocation))
    await db.execute(delete(EventPlan))
    await db.execute(delete(Event))
    await db.execute(delete(HistoricalEvent))
    await db.execute(delete(Resource))
    await db.execute(delete(Venue))
    
    current_user.onboarding_completed = False
    await db.commit()
    return {"status": "success", "message": "Workspace has been cleared."}
