from datetime import datetime, timedelta

import pytest

from app.services.performance_prediction import (
    PerformanceSet,
    predict_next_performance,
)


def build_history(session_count: int) -> list[PerformanceSet]:
    start = datetime(2026, 1, 1, 10, 0)
    history = []

    for session in range(session_count):
        performed_at = start + timedelta(days=session * 7)
        for set_number in range(1, 4):
            history.append(
                PerformanceSet(
                    performed_at=performed_at,
                    weight=40 + session * 2.5,
                    reps=10 - (set_number - 1),
                    set_number=set_number,
                )
            )

    return history


def test_prediction_requires_eight_distinct_sessions():
    prediction = predict_next_performance(
        build_history(7),
        [55, 57.5],
    )

    assert prediction is None


def test_prediction_selects_a_candidate_and_reports_confidence():
    prediction = predict_next_performance(
        build_history(10),
        [62.5, 65],
    )

    assert prediction is not None
    assert prediction.weight in {62.5, 65}
    assert prediction.predicted_reps > 0
    assert prediction.confidence == pytest.approx(0.62)
    assert prediction.session_count == 10
