import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from app.database.database import get_db
from app.models.historical_event import HistoricalEvent
from app.models.user import User
from app.schemas.schemas import HistoricalEventCreate, HistoricalEventUpdate, HistoricalEventOut
from app.api.auth import get_current_user
from typing import List

router = APIRouter(prefix="/api/history", tags=["history"])

REQUIRED_CSV_COLUMNS = {"event_name", "event_type", "date", "registrations", "teams", "duration", "attendance", "venue_type"}
VALID_EVENT_TYPES = {"hackathon", "symposium", "cultural", "sports", "workshop", "seminar", "conference", "other"}


def _build_event(user_id: int, **kwargs) -> HistoricalEvent:
    attendance = kwargs["attendance"]
    registrations = kwargs["registrations"]
    event_date = kwargs["event_date"]
    return HistoricalEvent(
        user_id=user_id,
        event_name=kwargs.get("event_name"),
        event_type=kwargs["event_type"],
        registrations=registrations,
        teams=kwargs.get("teams"),
        duration_hours=kwargs["duration_hours"],
        attendance=attendance,
        venue_type=kwargs.get("venue_type", "indoor"),
        event_date=event_date,
        day_of_week=event_date.weekday(),
        month=event_date.month,
        attendance_rate=round(attendance / registrations, 3) if registrations > 0 else 0,
    )


@router.get("", response_model=List[HistoricalEventOut])
async def list_history(
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id).order_by(HistoricalEvent.event_date.desc())
    if event_type:
        query = query.where(HistoricalEvent.event_type == event_type)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/count")
async def count_history(
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(func.count()).select_from(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
    if event_type:
        query = query.where(HistoricalEvent.event_type == event_type)
    result = await db.execute(query)
    return {"count": result.scalar()}


@router.post("", response_model=HistoricalEventOut, status_code=201)
async def create_history(
    data: HistoricalEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = _build_event(
        user_id=current_user.id,
        event_name=data.event_name,
        event_type=data.event_type,
        registrations=data.registrations,
        teams=data.teams,
        duration_hours=data.duration_hours,
        attendance=data.attendance,
        venue_type=data.venue_type,
        event_date=data.event_date,
    )
    db.add(event)
    await db.flush()
    return event


@router.put("/{history_id}", response_model=HistoricalEventOut)
async def update_history(
    history_id: int,
    data: HistoricalEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(HistoricalEvent).where(
        HistoricalEvent.id == history_id,
        HistoricalEvent.user_id == current_user.id,
    ))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Historical event not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(event, field, value)
    # Recompute derived fields if attendance or registrations changed
    if data.attendance is not None or data.registrations is not None:
        event.attendance_rate = round(event.attendance / event.registrations, 3) if event.registrations > 0 else 0
    if data.event_date is not None:
        event.day_of_week = event.event_date.weekday()
        event.month = event.event_date.month
    await db.flush()
    return event


@router.delete("/{history_id}", status_code=204)
async def delete_history(
    history_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(HistoricalEvent).where(
        HistoricalEvent.id == history_id,
        HistoricalEvent.user_id == current_user.id,
    ))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Historical event not found")
    await db.delete(event)
    await db.flush()


@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="Empty CSV file")

    headers = {h.strip().lower() for h in reader.fieldnames}
    missing = REQUIRED_CSV_COLUMNS - headers
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"CSV missing required columns: {', '.join(sorted(missing))}",
        )

    imported = 0
    errors = []
    for i, row in enumerate(reader, start=2):
        try:
            event_type = row.get("event_type", "").strip().lower()
            if event_type not in VALID_EVENT_TYPES:
                event_type = "other"
            regs = int(row["registrations"])
            att = int(row["attendance"])
            dur = int(row["duration"])
            teams_raw = row.get("teams", "").strip()
            teams = int(teams_raw) if teams_raw and teams_raw != "0" and teams_raw else None
            event_date = date.fromisoformat(row["date"].strip())

            event = _build_event(
                user_id=current_user.id,
                event_name=row.get("event_name", "").strip() or None,
                event_type=event_type,
                registrations=regs,
                teams=teams,
                duration_hours=dur,
                attendance=att,
                venue_type=row.get("venue_type", "indoor").strip().lower() or "indoor",
                event_date=event_date,
            )
            db.add(event)
            imported += 1
        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    await db.flush()
    return {"imported": imported, "errors": errors, "total_rows": imported + len(errors)}


@router.get("/csv-template")
async def get_csv_template():
    from fastapi.responses import StreamingResponse
    header = "event_name,event_type,date,registrations,teams,duration,attendance,venue_type\n"
    example = "Annual Hackathon 2024,hackathon,2024-10-12,800,200,24,672,indoor\n"
    example2 = "Tech Symposium 2024,symposium,2024-09-20,400,0,8,352,indoor\n"
    content = header + example + example2
    return StreamingResponse(
        io.StringIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=historical_data_template.csv"},
    )


@router.post("/load-sample")
async def load_sample_dataset(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Load sample historical dataset for the current user. Only runs when explicitly triggered."""
    # Check if user already has data
    count_result = await db.execute(
        select(func.count()).select_from(HistoricalEvent).where(HistoricalEvent.user_id == current_user.id)
    )
    existing_count = count_result.scalar()

    sample_records = [
        ("Annual Hackathon 2024",       "hackathon",   date(2024, 10, 12), 800,  200, 24, 672,  "indoor"),
        ("Spring Hackathon 2024",       "hackathon",   date(2024,  3, 15), 600,  150, 24, 498,  "indoor"),
        ("Winter Hackathon 2023",       "hackathon",   date(2023, 11,  8), 500,  125, 20, 422,  "indoor"),
        ("National Hackathon 2023",     "hackathon",   date(2023,  2, 20), 1000, 250, 24, 820,  "indoor"),
        ("Summer Code Sprint 2024",     "hackathon",   date(2024,  8,  5), 750,  188, 24, 630,  "indoor"),
        ("Tech Symposium 2024",         "symposium",   date(2024,  9, 20), 400,  None,  8, 352, "indoor"),
        ("Research Symposium 2024",     "symposium",   date(2024,  1, 14), 300,  None,  8, 270, "indoor"),
        ("Annual Cultural Fest 2024",   "cultural",    date(2024,  1, 26), 1200, None,  8, 936, "outdoor"),
        ("Winter Cultural 2023",        "cultural",    date(2023, 12, 25), 1500, None, 10, 1200,"outdoor"),
        ("Sports Meet 2024",            "sports",      date(2024,  9,  7), 600,  40,    6, 408, "outdoor"),
        ("Python Workshop 2024",        "workshop",    date(2024,  7, 18), 150,  None,  4, 138, "indoor"),
        ("ML Workshop 2024",            "workshop",    date(2024,  3, 28), 200,  None,  6, 182, "indoor"),
    ]

    added = 0
    for name, etype, edate, regs, teams, dur, att, vtype in sample_records:
        event = _build_event(
            user_id=current_user.id,
            event_name=name,
            event_type=etype,
            registrations=regs,
            teams=teams,
            duration_hours=dur,
            attendance=att,
            venue_type=vtype,
            event_date=edate,
        )
        db.add(event)
        added += 1

    await db.flush()
    return {
        "added": added,
        "existing_before": existing_count,
        "message": f"Loaded {added} sample historical events.",
    }
