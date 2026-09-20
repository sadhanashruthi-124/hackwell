from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime, date
import csv
import io

from app.database.database import get_db
from app.models.historical_event import HistoricalEvent
from app.models.user import User
from app.schemas.schemas import HistoricalEventCreate, HistoricalEventUpdate, HistoricalEventOut
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("")
async def list_history(
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(HistoricalEvent).order_by(HistoricalEvent.event_date.desc())
    if event_type:
        query = query.where(HistoricalEvent.event_type == event_type)
    result = await db.execute(query)
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "event_name": r.event_name or f"{r.event_type.title()} ({r.event_date})",
            "event_type": r.event_type,
            "registrations": r.registrations,
            "teams": r.teams,
            "duration_hours": r.duration_hours,
            "attendance": r.attendance,
            "venue_type": r.venue_type,
            "event_date": r.event_date.isoformat(),
            "day_of_week": r.day_of_week,
            "month": r.month,
            "attendance_rate": r.attendance_rate,
        }
        for r in rows
    ]


@router.post("", response_model=HistoricalEventOut, status_code=201)
async def create_historical_event(
    data: HistoricalEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.registrations <= 0:
        raise HTTPException(status_code=400, detail="Registrations must be greater than 0")
    
    rate = round(data.attendance / data.registrations, 3) if data.registrations > 0 else 0.0
    day_of_week = data.event_date.weekday()
    month = data.event_date.month

    rec = HistoricalEvent(
        event_name=data.event_name,
        event_type=data.event_type.lower(),
        registrations=data.registrations,
        teams=data.teams,
        duration_hours=data.duration_hours,
        attendance=data.attendance,
        venue_type=data.venue_type.lower(),
        event_date=data.event_date,
        day_of_week=day_of_week,
        month=month,
        attendance_rate=rate,
    )
    db.add(rec)
    await db.flush()
    return rec


@router.put("/{event_id}", response_model=HistoricalEventOut)
async def update_historical_event(
    event_id: int,
    data: HistoricalEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(HistoricalEvent).where(HistoricalEvent.id == event_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Historical event not found")

    for field, value in data.model_dump(exclude_none=True).items():
        if field == "event_type" and value:
            value = value.lower()
        if field == "venue_type" and value:
            value = value.lower()
        setattr(rec, field, value)

    if rec.event_date:
        rec.day_of_week = rec.event_date.weekday()
        rec.month = rec.event_date.month
    if rec.registrations and rec.registrations > 0:
        rec.attendance_rate = round(rec.attendance / rec.registrations, 3)

    await db.flush()
    return rec


@router.delete("/{event_id}", status_code=204)
async def delete_historical_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(HistoricalEvent).where(HistoricalEvent.id == event_id))
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Historical event not found")
    await db.delete(rec)


@router.get("/template-csv")
async def download_csv_template(current_user: User = Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["event_name", "event_type", "date", "registrations", "teams", "duration", "attendance", "venue_type"])
    writer.writerow(["Annual Hackathon 2025", "hackathon", "2025-10-12", "800", "200", "24", "672", "indoor"])
    writer.writerow(["Tech Symposium 2025", "symposium", "2025-09-20", "400", "0", "8", "352", "indoor"])
    writer.writerow(["Cultural Fest 2025", "cultural", "2025-01-26", "1200", "0", "8", "936", "outdoor"])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hackwell_historical_template.csv"},
    )


@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    try:
        decoded = content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            decoded = content.decode("latin1")
        except Exception:
            raise HTTPException(status_code=400, detail="Unable to parse file encoding. Please provide a standard UTF-8 CSV.")

    reader = csv.DictReader(io.StringIO(decoded))
    required_cols = {"event_type", "date", "registrations", "attendance"}
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file is empty or invalid.")

    # Normalize headers
    field_map = {fn.strip().lower(): fn for fn in reader.fieldnames}
    if not required_cols.issubset(set(field_map.keys())):
        missing = required_cols - set(field_map.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Missing required CSV columns: {', '.join(missing)}. Required: event_name, event_type, date, registrations, teams, duration, attendance, venue_type",
        )

    imported_count = 0
    for row_idx, row in enumerate(reader, start=1):
        try:
            name = row.get(field_map.get("event_name", ""), "").strip() or None
            et = row.get(field_map["event_type"], "").strip().lower()
            date_str = row.get(field_map["date"], "").strip()
            ev_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            regs = int(row.get(field_map["registrations"], 0))
            att = int(row.get(field_map["attendance"], 0))
            
            teams_raw = row.get(field_map.get("teams", ""), "").strip()
            teams = int(teams_raw) if teams_raw and teams_raw.isdigit() else None

            dur_raw = row.get(field_map.get("duration", ""), "").strip()
            dur = int(dur_raw) if dur_raw and dur_raw.isdigit() else 8

            vt = row.get(field_map.get("venue_type", ""), "indoor").strip().lower() or "indoor"

            if regs <= 0:
                continue

            rate = round(att / regs, 3)
            rec = HistoricalEvent(
                event_name=name,
                event_type=et,
                registrations=regs,
                teams=teams,
                duration_hours=dur,
                attendance=att,
                venue_type=vt,
                event_date=ev_date,
                day_of_week=ev_date.weekday(),
                month=ev_date.month,
                attendance_rate=rate,
            )
            db.add(rec)
            imported_count += 1
        except Exception as err:
            raise HTTPException(
                status_code=400,
                detail=f"Error on row {row_idx}: {str(err)}. Expected date format: YYYY-MM-DD",
            )

    await db.flush()
    return {"message": f"Successfully imported {imported_count} historical events", "imported_count": imported_count}

