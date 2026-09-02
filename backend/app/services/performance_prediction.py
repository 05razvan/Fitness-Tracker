from dataclasses import dataclass
from datetime import datetime

from sklearn.ensemble import GradientBoostingRegressor


MINIMUM_SESSIONS = 8


@dataclass(frozen=True)
class PerformanceSet:
    performed_at: datetime
    weight: float
    reps: int
    set_number: int


@dataclass(frozen=True)
class PerformancePrediction:
    weight: float
    predicted_reps: float
    confidence: float
    session_count: int


def predict_next_performance(
    performance_sets: list[PerformanceSet],
    candidate_weights: list[float],
) -> PerformancePrediction | None:
    """Predict reps at candidate weights using one user's exercise history.

    The model is intentionally trained per user and exercise. Returning ``None``
    is part of the contract: callers should use a deterministic cold-start
    recommendation until enough distinct sessions have been recorded.
    """
    if not performance_sets or not candidate_weights:
        return None

    ordered_sets = sorted(
        performance_sets,
        key=lambda item: (item.performed_at, item.set_number),
    )
    session_dates = sorted({item.performed_at for item in ordered_sets})

    if len(session_dates) < MINIMUM_SESSIONS:
        return None

    first_session = session_dates[0]
    session_positions = {
        performed_at: position
        for position, performed_at in enumerate(session_dates)
    }
    features = []
    targets = []

    for item in ordered_sets:
        features.append(
            [
                item.weight,
                float(item.set_number),
                float(session_positions[item.performed_at]),
                float((item.performed_at - first_session).days),
            ]
        )
        targets.append(float(item.reps))

    model = GradientBoostingRegressor(
        n_estimators=80,
        max_depth=2,
        learning_rate=0.05,
        loss="huber",
        random_state=42,
    )
    model.fit(features, targets)

    next_session_position = float(len(session_dates))
    next_session_day = float((session_dates[-1] - first_session).days + 7)
    candidate_features = [
        [weight, 1.0, next_session_position, next_session_day]
        for weight in candidate_weights
    ]
    predictions = model.predict(candidate_features)

    viable = [
        (weight, prediction)
        for weight, prediction in zip(candidate_weights, predictions)
        if prediction >= 6
    ]
    selected_weight, selected_reps = (
        max(viable, key=lambda item: item[0])
        if viable
        else max(
            zip(candidate_weights, predictions),
            key=lambda item: item[1],
        )
    )

    confidence = min(0.9, 0.55 + (len(session_dates) - MINIMUM_SESSIONS) * 0.035)

    return PerformancePrediction(
        weight=float(selected_weight),
        predicted_reps=max(1.0, float(selected_reps)),
        confidence=confidence,
        session_count=len(session_dates),
    )
