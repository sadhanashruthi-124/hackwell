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
  historical_events_used (int)
  model_source          (str) — "base_model" or "user_data"
"""

import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

MODEL_PATH = Path(__file__).parent / "rf_model.joblib"
ENCODER_PATH = Path(__file__).parent / "label_encoder.joblib"

# Minimum historical events required to use user data for prediction
MIN_HISTORICAL_EVENTS = 3

EVENT_TYPES = [
    "hackathon", "symposium", "cultural", "sports",
    "workshop", "seminar", "conference", "other"
]

_base_model: RandomForestRegressor | None = None
_encoder: LabelEncoder | None = None


def _build_encoder() -> LabelEncoder:
    enc = LabelEncoder()
    enc.fit(EVENT_TYPES)
    return enc


def _get_encoder() -> LabelEncoder:
    global _encoder
    if _encoder is None:
        if ENCODER_PATH.exists():
            _encoder = joblib.load(ENCODER_PATH)
        else:
            _encoder = _build_encoder()
            joblib.dump(_encoder, ENCODER_PATH)
    return _encoder


def get_base_model() -> RandomForestRegressor:
    """Return the base model (pre-trained on synthetic data). Used when user has < MIN_HISTORICAL_EVENTS."""
    global _base_model
    if _base_model is None:
        if MODEL_PATH.exists():
            _base_model = joblib.load(MODEL_PATH)
        else:
            _base_model = _train_on_seed_data()
    return _base_model


def _prepare_features(
    event_type: str,
    registrations: int,
    teams: int,
    duration_hours: int,
    day_of_week: int,
    month: int,
) -> np.ndarray:
    enc = _get_encoder()
    try:
        et_encoded = enc.transform([event_type])[0]
    except ValueError:
        et_encoded = 7  # "other"

    return np.array([[et_encoded, registrations, teams, duration_hours, day_of_week, month]])


def _train_user_model(historical_records: list[dict]) -> RandomForestRegressor:
    """Train a model on the user's actual historical records."""
    enc = _get_encoder()
    rows = []
    for rec in historical_records:
        et = rec.get("event_type", "other")
        try:
            et_encoded = enc.transform([et])[0]
        except ValueError:
            et_encoded = 7
        rows.append({
            "event_type": et_encoded,
            "registrations": rec["registrations"],
            "teams": rec.get("teams") or 0,
            "duration_hours": rec["duration_hours"],
            "day_of_week": rec["day_of_week"],
            "month": rec["month"],
            "attendance": rec["attendance"],
        })
    df = pd.DataFrame(rows)
    X = df[["event_type", "registrations", "teams", "duration_hours", "day_of_week", "month"]]
    y = df["attendance"]

    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        min_samples_split=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)
    return model


def predict(
    event_type: str,
    registrations: int,
    teams: int,
    duration_hours: int,
    day_of_week: int,
    month: int,
    historical_records: list[dict] | None = None,
) -> dict:
    """
    Predict attendance.

    If historical_records has >= MIN_HISTORICAL_EVENTS entries, train on user data.
    Otherwise use the pre-trained base model.
    """
    n_records = len(historical_records) if historical_records else 0

    if historical_records and n_records >= MIN_HISTORICAL_EVENTS:
        model = _train_user_model(historical_records)
        model_source = "user_data"
    else:
        model = get_base_model()
        model_source = "base_model"

    X = _prepare_features(event_type, registrations, teams, duration_hours, day_of_week, month)

    # Individual tree predictions for confidence interval
    tree_preds = np.array([tree.predict(X)[0] for tree in model.estimators_])
    predicted = int(np.mean(tree_preds))
    low = int(np.percentile(tree_preds, 10))
    high = int(np.percentile(tree_preds, 90))

    return {
        "predicted_attendance": predicted,
        "confidence_low": low,
        "confidence_high": high,
        "historical_events_used": n_records,
        "model_source": model_source,
    }


def _train_on_seed_data() -> RandomForestRegressor:
    """Train base model on synthetic seed data. Only runs once when no model file exists."""
    import random
    random.seed(42)
    np.random.seed(42)

    records = []
    enc = _build_encoder()

    # Historical patterns (event_type, avg_rate, std)
    patterns = [
        ("hackathon",   800, 0.84, 0.04, 24, 1),
        ("hackathon",   600, 0.83, 0.04, 24, 1),
        ("hackathon",   500, 0.85, 0.03, 20, 0),
        ("hackathon",  1000, 0.82, 0.05, 24, 2),
        ("hackathon",   750, 0.84, 0.04, 24, 3),
        ("symposium",   400, 0.88, 0.05,  8, 0),
        ("symposium",   300, 0.90, 0.04,  8, 4),
        ("symposium",   500, 0.87, 0.05,  8, 1),
        ("cultural",   1200, 0.78, 0.06,  8, 6),
        ("cultural",   1500, 0.80, 0.06, 10, 5),
        ("cultural",    900, 0.75, 0.07,  6, 5),
        ("sports",      600, 0.70, 0.08,  6, 5),
        ("sports",      800, 0.68, 0.08,  6, 6),
        ("workshop",    150, 0.92, 0.03,  4, 0),
        ("workshop",    200, 0.91, 0.03,  6, 1),
        ("seminar",     250, 0.93, 0.03,  3, 0),
        ("seminar",     180, 0.94, 0.02,  2, 2),
        ("conference",  350, 0.86, 0.05, 16, 0),
        ("conference",  500, 0.85, 0.05, 24, 1),
        ("hackathon",   900, 0.83, 0.04, 24, 2),
        ("hackathon",   650, 0.84, 0.04, 18, 0),
        ("symposium",   450, 0.89, 0.04,  8, 3),
        ("cultural",   1000, 0.77, 0.06,  8, 4),
        ("workshop",    120, 0.93, 0.02,  4, 2),
    ]

    for et, regs, rate_mean, rate_std, dur, dow in patterns:
        for month in [2, 5, 8, 10, 11]:
            rate = max(0.5, min(1.0, np.random.normal(rate_mean, rate_std)))
            attendance = int(regs * rate)
            teams = regs // 4 if et == "hackathon" else 0
            records.append({
                "event_type": enc.transform([et])[0],
                "registrations": regs + random.randint(-30, 30),
                "teams": teams,
                "duration_hours": dur,
                "day_of_week": dow,
                "month": month,
                "attendance": attendance,
            })

    df = pd.DataFrame(records)
    X = df[["event_type", "registrations", "teams", "duration_hours", "day_of_week", "month"]]
    y = df["attendance"]

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        min_samples_split=3,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(enc, ENCODER_PATH)

    return model
