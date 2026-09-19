"""
Resource demand estimation service.
Configurable rules:
  - 1 computer  per participant
  - 1 chair     per participant (+ 5% buffer)
  - 1 projector per 50 participants
  - 1 bus       per 112 participants
"""

# Default resource rules (can be overridden via Settings)
RESOURCE_RULES: dict[str, dict] = {
    "computers": {"per_participant": 1.0, "minimum": 10},
    "chairs":    {"per_participant": 1.05, "minimum": 20},
    "projectors": {"per_50": 1.0, "minimum": 2},
    "buses":     {"per_participants": 112, "minimum": 1},
}


def estimate_demand(attendance: int, duration_hours: int, event_type: str) -> dict:
    """Return estimated resource quantities for the given attendance."""
    computers = max(RESOURCE_RULES["computers"]["minimum"], round(attendance * RESOURCE_RULES["computers"]["per_participant"]))
    chairs    = max(RESOURCE_RULES["chairs"]["minimum"], round(attendance * RESOURCE_RULES["chairs"]["per_participant"]))
    projectors = max(RESOURCE_RULES["projectors"]["minimum"], round(attendance / 50))
    buses      = max(RESOURCE_RULES["buses"]["minimum"], round(attendance / 112))

    # For non-tech events, fewer computers needed
    if event_type in ("cultural", "sports"):
        computers = max(10, round(attendance * 0.1))

    return {
        "computers": computers,
        "chairs":    chairs,
        "projectors": projectors,
        "buses":     buses,
    }
