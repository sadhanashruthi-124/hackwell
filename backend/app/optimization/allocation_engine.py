"""
Constraint-based allocation engine.

Steps:
1. Get predicted attendance
2. Calculate resource demand
3. Fetch available resources from DB
4. Check venue capacity
5. Apply constraints
6. Allocate resources
7. Detect conflicts/shortages
8. Suggest alternatives
9. Return structured plan
"""




def run_allocation(
    predicted_attendance: int,
    event_type: str,
    duration_hours: int,
    available_resources: dict,    # {"computers": 650, "projectors": 8, ...}
    venues: list[dict],           # [{"name": ..., "capacity": ...}, ...]
    demand: dict,                 # {"computers": 100, ...} predicted demand
    req_resources: dict | None = None,  # explicitly requested by organizer
) -> dict:

    # Override with explicitly requested quantities if provided
    if req_resources:
        for k, v in req_resources.items():
            if v and v > 0:
                demand[k] = v

    allocation = {}
    alerts = []
    recommendations = []
    overall_status = "ok"

    # ── Resource allocation ────────────────────────────────────────────────
    for resource, required in demand.items():
        available = available_resources.get(resource, 0)
        allocated = min(required, available)
        shortage = required - allocated

        allocation[resource] = {
            "required": required,
            "available": available,
            "allocated": allocated,
            "shortage": shortage,
        }

        if shortage > 0:
            overall_status = "shortage"
            alerts.append({
                "level": "warning",
                "type": "shortage",
                "resource": resource,
                "message": f"{shortage} {resource} short",
                "detail": f"{required} required, only {available} available.",
            })
            recommendations.append(
                f"Arrange {shortage} additional {resource} from external sources or other departments."
            )

    # ── Venue allocation ───────────────────────────────────────────────────
    selected_venues = []
    remaining_capacity_needed = predicted_attendance

    for venue in sorted(venues, key=lambda v: v["capacity"], reverse=True):
        if remaining_capacity_needed <= 0:
            break
        if venue.get("available", True):
            selected_venues.append(venue)
            remaining_capacity_needed -= venue["capacity"]

    if remaining_capacity_needed > 0:
        overall_status = "conflict"
        alerts.append({
            "level": "error",
            "type": "venue_capacity",
            "resource": "venue",
            "message": f"Venue capacity insufficient by {remaining_capacity_needed} seats",
            "detail": "Available venues cannot accommodate predicted attendance.",
        })
        recommendations.append(
            "Consider splitting the event across multiple time slots or arranging additional venue."
        )
    else:
        alerts.append({
            "level": "success",
            "type": "venue",
            "resource": "venue",
            "message": "Venue capacity satisfied",
            "detail": f"Selected venues accommodate {predicted_attendance} participants.",
        })

    # ── Transport schedule ─────────────────────────────────────────────────
    n_buses = allocation.get("buses", {}).get("allocated", 1)
    transport_schedule = _generate_transport_schedule(n_buses)

    # ── Event timeline ─────────────────────────────────────────────────────
    timeline = _generate_timeline(duration_hours)

    return {
        "predicted_attendance": predicted_attendance,
        "demand": demand,
        "venues": selected_venues,
        "resource_allocation": [
            {
                "resource": k,
                "required": v["required"],
                "available": v["available"],
                "allocated": v["allocated"],
                "shortage": v["shortage"],
            }
            for k, v in allocation.items()
        ],
        "alerts": alerts,
        "recommendations": recommendations,
        "transport_schedule": transport_schedule,
        "timeline": timeline,
        "status": overall_status,
    }


def _generate_transport_schedule(n_buses: int) -> list[dict]:
    if n_buses == 0:
        return []
    schedule = []
    half = max(1, n_buses // 2)
    rest = n_buses - half
    if half > 0:
        schedule.append({
            "buses": f"Bus 1–{half}",
            "route": "Main Campus → Venue",
            "time": "08:00",
        })
    if rest > 0:
        schedule.append({
            "buses": f"Bus {half+1}–{n_buses}",
            "route": "Hostel → Venue",
            "time": "08:30",
        })
    schedule.append({
        "buses": f"All {n_buses} buses",
        "route": "Return runs",
        "time": "After event ends",
    })
    return schedule


def _generate_timeline(duration_hours: int) -> list[dict]:
    timeline = [
        {"time": "07:00", "activity": "Venue & Equipment Setup"},
        {"time": "08:00", "activity": "Registration Opens"},
        {"time": "09:00", "activity": "Inauguration / Opening Ceremony"},
        {"time": "10:00", "activity": "Event Begins"},
    ]
    if duration_hours >= 12:
        timeline.append({"time": "13:00", "activity": "Lunch Break"})
    if duration_hours >= 20:
        timeline.append({"time": "18:00", "activity": "Dinner Break"})
    if duration_hours >= 24:
        timeline.append({"time": "00:00", "activity": "Midnight Check-in"})
    timeline.append({"time": "Closing", "activity": "Valedictory & Prize Distribution"})
    return timeline
