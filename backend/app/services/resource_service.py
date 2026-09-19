"""
Resource demand estimation service.

Default configurable rules (can be overridden per user via Settings):
  - 1 computer  per participant
  - 1.05 chairs per participant
  - 1 projector per 50 participants
  - 1 bus       per 112 participants
"""

# Default resource rules
DEFAULT_RULES = {
    "computers_per_participant": 1.0,
    "chairs_per_participant": 1.05,
    "projectors_per_n_participants": 50,
    "buses_per_n_participants": 112,
    "min_computers": 10,
    "min_chairs": 20,
    "min_projectors": 1,
    "min_buses": 1,
}


def estimate_demand_with_rules(attendance: int, duration_hours: int, event_type: str, rules=None) -> dict:
    """
    Return estimated resource quantities for the given attendance.
    Uses configurable rules (AllocationRule model instance) if provided,
    otherwise falls back to defaults.
    """
    r = rules  # AllocationRule model instance or None

    computers_per_p = r.computers_per_participant if r else DEFAULT_RULES["computers_per_participant"]
    chairs_per_p = r.chairs_per_participant if r else DEFAULT_RULES["chairs_per_participant"]
    proj_per_n = r.projectors_per_n_participants if r else DEFAULT_RULES["projectors_per_n_participants"]
    buses_per_n = r.buses_per_n_participants if r else DEFAULT_RULES["buses_per_n_participants"]
    min_computers = r.min_computers if r else DEFAULT_RULES["min_computers"]
    min_chairs = r.min_chairs if r else DEFAULT_RULES["min_chairs"]
    min_projectors = r.min_projectors if r else DEFAULT_RULES["min_projectors"]
    min_buses = r.min_buses if r else DEFAULT_RULES["min_buses"]

    computers = max(min_computers, round(attendance * computers_per_p))
    chairs = max(min_chairs, round(attendance * chairs_per_p))
    projectors = max(min_projectors, round(attendance / proj_per_n))
    buses = max(min_buses, round(attendance / buses_per_n))

    # For non-tech events, fewer computers needed
    if event_type in ("cultural", "sports"):
        computers = max(min_computers, round(attendance * 0.1))

    return {
        "computers": computers,
        "chairs": chairs,
        "projectors": projectors,
        "buses": buses,
    }


# Legacy alias for backwards compatibility
def estimate_demand(attendance: int, duration_hours: int, event_type: str) -> dict:
    return estimate_demand_with_rules(attendance, duration_hours, event_type, rules=None)
