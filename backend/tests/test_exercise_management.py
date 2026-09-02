import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models.workout import Workout, WorkoutExercise
from app.routers.exercises import create_exercise, delete_exercise, update_exercise
from app.schemas.exercise import ExerciseCreate, ExerciseUpdate


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


def exercise_data(name: str):
    return ExerciseCreate(
        name=name,
        primary_muscle="Back",
        secondary_muscles="Biceps",
        movement_pattern="Horizontal Pull",
        equipment="Cable",
        exercise_type="Weighted",
        category="Compound",
    )


def test_exercise_can_be_created_updated_and_deleted(db_session):
    exercise = create_exercise(exercise_data("Custom Cable Row"), db_session)
    updated = update_exercise(
        exercise.id,
        ExerciseUpdate(**exercise_data("Supported Cable Row").model_dump()),
        db_session,
    )

    assert updated.name == "Supported Cable Row"

    delete_exercise(exercise.id, db_session)

    assert db_session.query(type(exercise)).count() == 0


def test_exercise_names_are_unique_ignoring_case(db_session):
    create_exercise(exercise_data("Custom Pulldown"), db_session)

    with pytest.raises(HTTPException) as error:
        create_exercise(exercise_data("custom pulldown"), db_session)

    assert error.value.status_code == 400


def test_exercise_used_in_workout_cannot_be_deleted(db_session):
    exercise = create_exercise(exercise_data("Tracked Row"), db_session)
    workout = Workout(user_id=1, name="Pull day")
    db_session.add(workout)
    db_session.flush()
    db_session.add(
        WorkoutExercise(
            workout_id=workout.id,
            exercise_id=exercise.id,
            order=1,
        )
    )
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        delete_exercise(exercise.id, db_session)

    assert error.value.status_code == 409
    assert error.value.detail == "Exercise is used by workout history or a preset"
