from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.workout import WorkoutCreate, WorkoutResponse, WorkoutSetResponse, WorkoutSetUpdate


router = APIRouter(
    prefix="/workouts",
    tags=["Workouts"],
)


def get_workout_with_relationships(
    workout_id: int,
    db: Session,
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id)
        .first()
    )

    if not workout:
        return None

    workout_exercises = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.workout_id == workout.id)
        .order_by(WorkoutExercise.order)
        .all()
    )

    for workout_exercise in workout_exercises:
        workout_exercise.sets = (
            db.query(WorkoutSet)
            .filter(
                WorkoutSet.workout_exercise_id
                == workout_exercise.id
            )
            .order_by(WorkoutSet.set_number)
            .all()
        )

    workout.exercises = workout_exercises

    return workout


@router.post(
    "/",
    response_model=WorkoutResponse,
    status_code=201,
)
def create_workout(
    workout_data: WorkoutCreate,
    db: Session = Depends(get_db),
):
    # Temporary user ID until authentication is implemented.
    user_id = 1

    workout = Workout(
        user_id=user_id,
        name=workout_data.name,
        started_at=workout_data.started_at or datetime.utcnow(),
        body_weight=workout_data.body_weight,
        notes=workout_data.notes,
    )

    db.add(workout)
    db.flush()

    for exercise_data in workout_data.exercises:
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

        workout_exercise = WorkoutExercise(
            workout_id=workout.id,
            exercise_id=exercise_data.exercise_id,
            order=exercise_data.order,
            notes=exercise_data.notes,
        )

        db.add(workout_exercise)
        db.flush()

        for set_data in exercise_data.sets:
            workout_set = WorkoutSet(
                workout_exercise_id=workout_exercise.id,
                set_number=set_data.set_number,
                weight=set_data.weight,
                reps=set_data.reps,
                notes=set_data.notes,
            )

            db.add(workout_set)

    db.commit()

    return get_workout_with_relationships(workout.id, db)


@router.get(
    "/",
    response_model=list[WorkoutResponse],
)
def get_workouts(
    db: Session = Depends(get_db),
):
    user_id = 1

    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == user_id)
        .order_by(Workout.started_at.desc())
        .all()
    )

    return [
        get_workout_with_relationships(workout.id, db)
        for workout in workouts
    ]


@router.get(
    "/{workout_id}",
    response_model=WorkoutResponse,
)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
):
    workout = get_workout_with_relationships(workout_id, db)

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Workout not found",
        )

    return workout


@router.patch(
    "/{workout_id}/complete",
    response_model=WorkoutResponse,
)
def complete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id)
        .first()
    )

    if not workout:
        raise HTTPException(
            status_code=404,
            detail="Workout not found",
        )

    if workout.completed_at is None:
        workout.completed_at = datetime.utcnow()

        db.commit()

    return get_workout_with_relationships(workout.id, db)


@router.patch(
    "/sets/{set_id}",
    response_model=WorkoutSetResponse,
)
def update_workout_set(
    set_id: int,
    set_data: WorkoutSetUpdate,
    db: Session = Depends(get_db),
):
    workout_set = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.id == set_id)
        .first()
    )

    if not workout_set:
        raise HTTPException(
            status_code=404,
            detail="Workout set not found",
        )

    if "weight" in set_data.model_fields_set:
        workout_set.weight = set_data.weight

    if "reps" in set_data.model_fields_set:
        workout_set.reps = set_data.reps or 0

    if "notes" in set_data.model_fields_set:
        workout_set.notes = set_data.notes

    db.commit()
    db.refresh(workout_set)

    return workout_set
