from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.routers.exercises import get_progression_overview


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def add_performance(
    db_session,
    exercise_id,
    *,
    completed,
    weight,
    started_at,
    rpe=None,
    rir=None,
):
    workout = Workout(
        user_id=1,
        name="Analytics session",
        started_at=started_at,
        completed_at=started_at if completed else None,
    )
    db_session.add(workout)
    db_session.flush()
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=exercise_id,
        order=1,
    )
    db_session.add(workout_exercise)
    db_session.flush()
    db_session.add(
        WorkoutSet(
            workout_exercise_id=workout_exercise.id,
            set_number=1,
            weight=weight,
            reps=10,
            rpe=rpe,
            rir=rir,
        )
    )


def test_progression_overview_uses_only_completed_sessions(db_session):
    exercise = Exercise(
        name="Back Squat",
        primary_muscle="Quadriceps",
        exercise_type="strength",
        category="compound",
    )
    untrained = Exercise(
        name="Calf Raise",
        primary_muscle="Calves",
        exercise_type="strength",
        category="isolation",
    )
    db_session.add_all([exercise, untrained])
    db_session.flush()
    add_performance(
        db_session,
        exercise.id,
        completed=True,
        weight=80,
        started_at=datetime(2026, 8, 1, 10, 0),
        rpe=8.5,
        rir=2,
    )
    add_performance(
        db_session,
        exercise.id,
        completed=False,
        weight=120,
        started_at=datetime(2026, 8, 8, 10, 0),
    )
    db_session.commit()

    overview = get_progression_overview(db_session)
    squat = next(item for item in overview if item.id == exercise.id)
    calves = next(item for item in overview if item.id == untrained.id)

    assert len(squat.sessions) == 1
    assert squat.sessions[0].best_weight == 80
    assert squat.sessions[0].total_volume == 800
    assert squat.sessions[0].average_rpe == 8.5
    assert squat.sessions[0].average_rir == 2
    assert squat.personal_best_1rm == pytest.approx(106.67)
    assert calves.sessions == []
    assert calves.personal_best_1rm is None
