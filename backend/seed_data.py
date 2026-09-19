"""
Seed script — run once to populate the database with:
  - 2 demo users (admin + organizer)
  - 4 venues (Auditorium, Lab A, Lab B, Outdoor Ground)
  - 5 resources (Computers, Projectors, Chairs, Buses, Screens)
  - 24 historical event records for ML training
  - 3 sample events for demo
"""

import asyncio
import sys
from datetime import date, time, datetime, timezone

sys.path.insert(0, ".")
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.database.database import AsyncSessionLocal, engine, Base
from app.models import *  # noqa — import all models for table creation
from app.core.security import hash_password


async def seed():
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables created")

    async with AsyncSessionLocal() as db:
        # ── Users ──────────────────────────────────────────────────────────
        from app.models.user import User, UserRole
        from sqlalchemy import select

        existing = await db.execute(select(User).where(User.email == "admin@hackwell.edu"))
        if not existing.scalar_one_or_none():
            db.add_all([
                User(
                    name="Admin User",
                    email="admin@hackwell.edu",
                    password_hash=hash_password("admin123"),
                    role=UserRole.admin,
                ),
                User(
                    name="Priya Organizer",
                    email="organizer@hackwell.edu",
                    password_hash=hash_password("organizer123"),
                    role=UserRole.organizer,
                ),
                User(
                    name="Ravi Coordinator",
                    email="coordinator@hackwell.edu",
                    password_hash=hash_password("coord123"),
                    role=UserRole.coordinator,
                ),
            ])
            await db.commit()
            print("[OK] Users seeded")

        # ── Venues ─────────────────────────────────────────────────────────
        from app.models.venue import Venue
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
            await db.commit()
            print("[OK] Venues seeded")

        # ── Resources ──────────────────────────────────────────────────────
        from app.models.resource import Resource, ResourceStatus
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
            await db.commit()
            print("[OK] Resources seeded")

        # ── Historical Events ───────────────────────────────────────────────
        from app.models.historical_event import HistoricalEvent
        existing_h = await db.execute(select(HistoricalEvent))
        if not existing_h.scalars().first():
            historical_records = [
                # (event_type, registrations, teams, duration, attendance, venue_type, event_date)
                ("hackathon",   800, 200, 24,  672, "indoor",  date(2025, 10, 12), 6, 10),
                ("hackathon",   600, 150, 24,  498, "indoor",  date(2025,  3, 15), 5,  3),
                ("hackathon",   500, 125, 20,  422, "indoor",  date(2024, 11, 8),  4, 11),
                ("hackathon",  1000, 250, 24,  820, "indoor",  date(2024,  2, 20), 1,  2),
                ("hackathon",   750, 188, 24,  630, "indoor",  date(2025,  8, 5),  1,  8),
                ("hackathon",   900, 225, 24,  747, "indoor",  date(2024,  5, 18), 5,  5),
                ("symposium",   400,   0,  8,  352, "indoor",  date(2025,  9, 20), 5,  9),
                ("symposium",   300,   0,  8,  270, "indoor",  date(2025,  1, 14), 0,  1),
                ("symposium",   500,   0,  8,  437, "indoor",  date(2024,  7, 10), 2,  7),
                ("symposium",   450,   0, 16,  398, "indoor",  date(2025,  4, 22), 1,  4),
                ("cultural",   1200,   0,  8,  936, "outdoor", date(2025,  1, 26), 6,  1),
                ("cultural",   1500,   0, 10, 1200, "outdoor", date(2024, 12, 25), 3, 12),
                ("cultural",    900,   0,  6,  675, "outdoor", date(2025,  2, 14), 4,  2),
                ("cultural",   1100,   0,  8,  847, "outdoor", date(2024,  8, 15), 3,  8),
                ("sports",      600,  40,  6,  408, "outdoor", date(2025,  9,  7), 6,  9),
                ("sports",      800,  50,  6,  544, "outdoor", date(2024,  6, 21), 5,  6),
                ("workshop",    150,   0,  4,  138, "indoor",  date(2025,  7, 18), 4,  7),
                ("workshop",    200,   0,  6,  182, "indoor",  date(2025,  3, 28), 4,  3),
                ("workshop",    120,   0,  4,  111, "indoor",  date(2024, 10, 15), 1, 10),
                ("seminar",     250,   0,  3,  235, "indoor",  date(2025,  5, 10), 5,  5),
                ("seminar",     180,   0,  2,  170, "indoor",  date(2025,  2, 28), 4,  2),
                ("conference",  350,   0, 16,  301, "indoor",  date(2025,  6, 14), 5,  6),
                ("conference",  500,   0, 24,  427, "indoor",  date(2024,  9, 20), 4,  9),
                ("hackathon",   650, 163, 18,  547, "indoor",  date(2025,  7, 28), 0,  7),
            ]
            for et, regs, teams, dur, att, vt, ed, dow, month in historical_records:
                db.add(HistoricalEvent(
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
                ))
            await db.commit()
            print("[OK] Historical events seeded (24 records)")

        # ── Sample Events for demo ─────────────────────────────────────────
        from app.models.event import Event, EventStatus, EventType

        user_result = await db.execute(select(User).where(User.email == "organizer@hackwell.edu"))
        organizer = user_result.scalar_one_or_none()
        if organizer:
            existing_e = await db.execute(select(Event))
            if not existing_e.scalars().first():
                db.add_all([
                    Event(
                        name="Annual Hackathon 2026",
                        event_type=EventType.hackathon,
                        date=date(2026, 10, 12),
                        start_time=time(9, 0),
                        end_time=time(9, 0),  # 24hr event ends next day
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
                        created_by=organizer.id,
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
                        created_by=organizer.id,
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
                        created_by=organizer.id,
                    ),
                ])
                await db.commit()
                print("[OK] Sample events seeded")

    print("\n[OK] Database seeding complete!")
    print("   Login: organizer@hackwell.edu / organizer123")
    print("   Admin: admin@hackwell.edu / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
