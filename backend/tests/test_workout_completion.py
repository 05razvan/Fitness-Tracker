from datetime import datetime

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.routers.workouts import (
    add_workout_set,
    complete_workout,
    delete_workout_set,
    get_workout_with_relationships,
    update_workout_set,
)
from app.schemas.workout import WorkoutResponse, WorkoutSetUpdate


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


def test_update_set_can_clear_recorded_values(db_session):
    workout = Workout(user_id=1, name="Clear set test")
    db_session.add(workout)
    db_session.flush()
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=1,
        order=1,
    )
    db_session.add(workout_exercise)
    db_session.flush()
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        weight=50,
        reps=8,
        notes="Working set",
    )
    db_session.add(workout_set)
    db_session.commit()

    response = update_workout_set(
        workout_set.id,
        WorkoutSetUpdate(weight=None, reps=None, notes=None),
        db_session,
    )

    assert response.weight is None
    assert response.reps == 0
    assert response.notes is None


def test_sets_can_be_added_removed_and_renumbered(db_session):
    workout = Workout(user_id=1, name="Set management test")
    db_session.add(workout)
    db_session.flush()
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=1,
        order=1,
    )
    db_session.add(workout_exercise)
    db_session.commit()

    first_set = add_workout_set(workout_exercise.id, db_session)
    second_set = add_workout_set(workout_exercise.id, db_session)
    delete_workout_set(first_set.id, db_session)

    remaining_set = db_session.query(WorkoutSet).filter_by(id=second_set.id).one()
    assert remaining_set.set_number == 1


def test_completed_workout_sets_cannot_be_changed(db_session):
    workout = Workout(
        user_id=1,
        name="Locked workout",
        completed_at=datetime(2026, 8, 27, 11, 0),
    )
    db_session.add(workout)
    db_session.flush()
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=1,
        order=1,
    )
    db_session.add(workout_exercise)
    db_session.flush()
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise.id,
        set_number=1,
        weight=50,
        reps=8,
    )
    db_session.add(workout_set)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        update_workout_set(
            workout_set.id,
            WorkoutSetUpdate(weight=55),
            db_session,
        )

    assert error.value.status_code == 409
    assert error.value.detail == "Completed workouts cannot be changed"


def test_workout_includes_exercise_name_and_previous_performance(db_session):
    exercise = Exercise(
        name="Barbell Bench Press",
        primary_muscle="Chest",
        exercise_type="strength",
        category="compound",
    )
    db_session.add(exercise)
    db_session.flush()
    previous_workout = Workout(
        user_id=1,
        name="Previous push day",
        started_at=datetime(2026, 8, 20, 10, 0),
        completed_at=datetime(2026, 8, 20, 11, 0),
    )
    current_workout = Workout(
        user_id=1,
        name="Current push day",
        started_at=datetime(2026, 8, 27, 10, 0),
    )
    db_session.add_all([previous_workout, current_workout])
    db_session.flush()
    previous_exercise = WorkoutExercise(
        workout_id=previous_workout.id,
        exercise_id=exercise.id,
        order=1,
    )
    current_exercise = WorkoutExercise(
        workout_id=current_workout.id,
        exercise_id=exercise.id,
        order=1,
    )
    db_session.add_all([previous_exercise, current_exercise])
    db_session.flush()
    db_session.add_all([
        WorkoutSet(
            workout_exercise_id=previous_exercise.id,
            set_number=1,
            weight=60,
            reps=8,
        ),
        WorkoutSet(
            workout_exercise_id=current_exercise.id,
            set_number=1,
            weight=None,
            reps=0,
        ),
    ])
    db_session.commit()

    workout = get_workout_with_relationships(current_workout.id, db_session)
    response = WorkoutResponse.model_validate(workout)

    assert response.exercises[0].exercise_name == "Barbell Bench Press"
    assert response.exercises[0].previous_sets[0].weight == 60
    assert response.exercises[0].previous_sets[0].reps == 8
