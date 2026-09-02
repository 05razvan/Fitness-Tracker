import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base
from app.db.models.exercise import Exercise
from app.db.models.preset import PresetExercise, WorkoutPreset
from app.routers.presets import create_preset, delete_preset, update_preset
from app.schemas.preset import PresetCreate, PresetExerciseCreate, PresetUpdate


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


def add_exercise(db_session, name: str):
    exercise = Exercise(
        name=name,
        primary_muscle="Chest",
        exercise_type="strength",
        category="compound",
    )
    db_session.add(exercise)
    db_session.commit()
    return exercise


def test_preset_can_be_created_updated_and_deleted(db_session):
    bench_press = add_exercise(db_session, "Bench Press")
    incline_press = add_exercise(db_session, "Incline Press")
    created = create_preset(
        PresetCreate(
            name="Push Day",
            description="Chest focused",
            exercises=[
                PresetExerciseCreate(
                    exercise_id=bench_press.id,
                    order=1,
                    target_sets=3,
                    target_reps=8,
                )
            ],
        ),
        db_session,
    )

    updated = update_preset(
        created.id,
        PresetUpdate(
            name="Upper Push",
            description="Updated plan",
            exercises=[
                PresetExerciseCreate(
                    exercise_id=incline_press.id,
                    order=1,
                    target_sets=4,
                    target_reps=10,
                ),
                PresetExerciseCreate(
                    exercise_id=bench_press.id,
                    order=2,
                    target_sets=3,
                    target_reps=6,
                ),
            ],
        ),
        db_session,
    )

    assert updated.name == "Upper Push"
    assert [item.exercise_id for item in updated.exercises] == [
        incline_press.id,
        bench_press.id,
    ]
    assert updated.exercises[0].target_sets == 4

    delete_preset(created.id, db_session)

    assert db_session.query(WorkoutPreset).count() == 0
    assert db_session.query(PresetExercise).count() == 0


def test_preset_rejects_duplicate_exercises():
    with pytest.raises(ValidationError, match="duplicate exercises"):
        PresetCreate(
            name="Invalid preset",
            exercises=[
                PresetExerciseCreate(exercise_id=1, order=1),
                PresetExerciseCreate(exercise_id=1, order=2),
            ],
        )


def test_preset_rejects_non_sequential_order():
    with pytest.raises(ValidationError, match="sequential"):
        PresetCreate(
            name="Invalid order",
            exercises=[PresetExerciseCreate(exercise_id=1, order=2)],
        )
