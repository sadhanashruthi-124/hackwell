"""
Attendance Prediction Model — Random Forest Regression (scikit-learn)

Features:
  event_type_encoded  (int: 0–7)
  registrations       (int)
  teams               (int, 0 if not applicable)
  duration_hours      (int)
  day_of_week         (int: 0–6)
  month               (int: 1–12)

Output:
  predicted_attendance  (int)
  confidence_low        (int) — 10th percentile of tree predictions
  confidence_high       (int) — 90th percentile of tree predictions
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

EVENT_TYPES = [
    "hackathon", "symposium", "cultural", "sports",
    "workshop", "seminar", "conference", "other"
]


def _build_encoder() -> LabelEncoder:
    enc = LabelEncoder()
    enc.fit(EVENT_TYPES)
    return enc


def train_model_on_records(records: list) -> tuple[RandomForestRegressor, LabelEncoder]:
    """Train a Random Forest regressor on actual historical event records."""
    if len(records) < 3:
        raise ValueError("Minimum 3 historical events required for ML prediction.")

    enc = _build_encoder()
    data = []
    for r in records:
        et = r.event_type if hasattr(r, "event_type") else r.get("event_type", "other")
        try:
            et_enc = enc.transform([et.lower()])[0]
        except Exception:
            et_enc = 7

        regs = r.registrations if hasattr(r, "registrations") else r.get("registrations", 0)
        teams = (r.teams if hasattr(r, "teams") else r.get("teams", 0)) or 0
        dur = (r.duration_hours if hasattr(r, "duration_hours") else r.get("duration_hours", 8)) or 8
        dow = (r.day_of_week if hasattr(r, "day_of_week") else r.get("day_of_week", 0)) or 0
        month = (r.month if hasattr(r, "month") else r.get("month", 1)) or 1
        att = r.attendance if hasattr(r, "attendance") else r.get("attendance", 0)

        data.append({
            "event_type": et_enc,
            "registrations": regs,
            "teams": teams,
            "duration_hours": dur,
            "day_of_week": dow,
            "month": month,
            "attendance": att,
        })

    df = pd.DataFrame(data)
    X = df[["event_type", "registrations", "teams", "duration_hours", "day_of_week", "month"]]
    y = df["attendance"]

    n_trees = min(100, max(20, len(records) * 5))
    model = RandomForestRegressor(
        n_estimators=n_trees,
        max_depth=6,
        min_samples_split=2,
        random_state=42,
    )
    model.fit(X, y)
    return model, enc


def predict_from_records(
    records: list,
    event_type: str,
    registrations: int,
    teams: int,
    duration_hours: int,
    day_of_week: int,
    month: int,
) -> dict:
    """Predict attendance using a dynamically fitted Random Forest on actual records."""
    model, enc = train_model_on_records(records)
    try:
        et_encoded = enc.transform([event_type.lower()])[0]
    except Exception:
        et_encoded = 7

    X = np.array([[et_encoded, registrations, teams, duration_hours, day_of_week, month]])

    # Individual tree predictions for confidence interval
    tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
    predicted = int(np.round(np.mean(tree_preds)))
    # Clip bounds to realistic values
    predicted = max(1, min(registrations, predicted))
    
    low = int(np.round(np.percentile(tree_preds, 10)))
    high = int(np.round(np.percentile(tree_preds, 90)))

    low = max(1, min(predicted, low))
    high = max(predicted, min(registrations, high))

    return {
        "predicted_attendance": predicted,
        "confidence_low": low,
        "confidence_high": high,
        "historical_count": len(records),
        "model_name": "Random Forest Regression",
    }

