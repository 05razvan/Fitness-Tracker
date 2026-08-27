from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models.workout import Workout
from app.routers.workouts import complete_workout


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


def test_complete_workout_is_idempotent(db_session):
    workout = Workout(
        user_id=1,
        name="Completion test",
        started_at=datetime(2026, 8, 27, 10, 0),
    )
    db_session.add(workout)
    db_session.commit()

    first_response = complete_workout(workout.id, db_session)
    original_completed_at = first_response.completed_at
    second_response = complete_workout(workout.id, db_session)

    assert original_completed_at is not None
    assert second_response.completed_at == original_completed_at


def test_complete_missing_workout_returns_not_found(db_session):
    with pytest.raises(HTTPException) as error:
        complete_workout(999, db_session)

    assert error.value.status_code == 404
    assert error.value.detail == "Workout not found"
