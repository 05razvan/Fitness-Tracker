from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.db.models.preset import PresetExercise, WorkoutPreset
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.preset import PresetCreate, PresetResponse
from app.schemas.workout import WorkoutResponse
from app.routers.workouts import get_workout_with_relationships


router = APIRouter(
    prefix="/presets",
    tags=["Workout Presets"],
)


def get_preset_with_exercises(
    preset_id: int,
    db: Session,
):
    preset = (
        db.query(WorkoutPreset)
        .filter(WorkoutPreset.id == preset_id)
        .first()
    )

    if not preset:
        return None

    preset.exercises = (
        db.query(PresetExercise)
        .filter(PresetExercise.preset_id == preset.id)
        .order_by(PresetExercise.order)
        .all()
    )

    return preset


@router.post(
    "/",
    response_model=PresetResponse,
    status_code=201,
)
def create_preset(
    preset_data: PresetCreate,
    db: Session = Depends(get_db),
):
    user_id = 1

    preset = WorkoutPreset(
        user_id=user_id,
        name=preset_data.name,
        description=preset_data.description,
    )

    db.add(preset)
    db.flush()

    for exercise_data in preset_data.exercises:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_data.exercise_id)
            .first()
        )

        if not exercise:
            db.rollback()
            raise HTTPException(
                status_code=404,
                detail=f"Exercise {exercise_data.exercise_id} not found",
            )

        preset_exercise = PresetExercise(
            preset_id=preset.id,
            exercise_id=exercise_data.exercise_id,
            order=exercise_data.order,
            target_sets=exercise_data.target_sets,
            target_reps=exercise_data.target_reps,
            notes=exercise_data.notes,
        )

        db.add(preset_exercise)

    db.commit()

    return get_preset_with_exercises(preset.id, db)


@router.get(
    "/",
    response_model=list[PresetResponse],
)
def get_presets(
    db: Session = Depends(get_db),
):
    user_id = 1

    presets = (
        db.query(WorkoutPreset)
        .filter(WorkoutPreset.user_id == user_id)
        .order_by(WorkoutPreset.name)
        .all()
    )

    return [
        get_preset_with_exercises(preset.id, db)
        for preset in presets
    ]


@router.get(
    "/{preset_id}",
    response_model=PresetResponse,
)
def get_preset(
    preset_id: int,
    db: Session = Depends(get_db),
):
    preset = get_preset_with_exercises(preset_id, db)

    if not preset:
        raise HTTPException(
            status_code=404,
            detail="Preset not found",
        )

    return preset


@router.post(
    "/{preset_id}/start",
    response_model=WorkoutResponse,
    status_code=201,
)
def start_workout_from_preset(
    preset_id: int,
    db: Session = Depends(get_db),
):
    user_id = 1

    preset = get_preset_with_exercises(preset_id, db)

    if not preset:
        raise HTTPException(
            status_code=404,
            detail="Preset not found",
        )

    workout = Workout(
        user_id=user_id,
        name=preset.name,
        started_at=datetime.utcnow(),
    )

    db.add(workout)
    db.flush()

    for preset_exercise in preset.exercises:
        workout_exercise = WorkoutExercise(
            workout_id=workout.id,
            exercise_id=preset_exercise.exercise_id,
            order=preset_exercise.order,
            notes=preset_exercise.notes,
        )

        db.add(workout_exercise)
        db.flush()

        if preset_exercise.target_sets:
            for set_number in range(
                1,
                preset_exercise.target_sets + 1,
            ):
                workout_set = WorkoutSet(
                    workout_exercise_id=workout_exercise.id,
                    set_number=set_number,
                    weight=None,
                    reps=(
                        preset_exercise.target_reps
                        if preset_exercise.target_reps
                        else 0
                    ),
                )

                db.add(workout_set)

    db.commit()

    return get_workout_with_relationships(workout.id, db)
