from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.time import utc_now
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.workout import (
    WorkoutCreate,
    WorkoutExerciseAdd,
    WorkoutExerciseOrderUpdate,
    WorkoutExerciseResponse,
    WorkoutResponse,
    WorkoutSetResponse,
    WorkoutSetUpdate,
    WorkoutUpdate,
)


router = APIRouter(
    prefix="/workouts",
    tags=["Workouts"],
)


def get_workout_with_relationships(
    workout_id: int,
    db: Session,
    include_previous_performance: bool = True,
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
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == workout_exercise.exercise_id)
            .first()
        )
        workout_exercise.exercise_name = (
            exercise.name if exercise else f"Exercise {workout_exercise.exercise_id}"
        )
        workout_exercise.previous_sets = []

        if include_previous_performance:
            previous_workout_exercise = (
                db.query(WorkoutExercise)
                .join(Workout, Workout.id == WorkoutExercise.workout_id)
                .filter(
                    WorkoutExercise.exercise_id == workout_exercise.exercise_id,
                    WorkoutExercise.workout_id != workout.id,
                    Workout.user_id == workout.user_id,
                    Workout.completed_at.isnot(None),
                    Workout.started_at < workout.started_at,
                )
                .order_by(Workout.started_at.desc())
                .first()
            )
            workout_exercise.previous_sets = (
                db.query(WorkoutSet)
                .filter(
                    WorkoutSet.workout_exercise_id == previous_workout_exercise.id,
                    WorkoutSet.weight.isnot(None),
                    WorkoutSet.weight > 0,
                    WorkoutSet.reps > 0,
                )
                .order_by(WorkoutSet.set_number)
                .all()
                if previous_workout_exercise
                else []
            )

    workout.exercises = workout_exercises

    return workout


def ensure_workout_is_active(workout_id: int, db: Session):
    workout = db.query(Workout).filter(Workout.id == workout_id).first()

    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    if workout.completed_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Completed workouts cannot be changed",
        )

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
        started_at=workout_data.started_at or utc_now(),
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
        get_workout_with_relationships(
            workout.id,
            db,
            include_previous_performance=False,
        )
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
    "/{workout_id}",
    response_model=WorkoutResponse,
)
def update_workout(
    workout_id: int,
    workout_data: WorkoutUpdate,
    db: Session = Depends(get_db),
):
    workout = ensure_workout_is_active(workout_id, db)

    if "name" in workout_data.model_fields_set:
        workout.name = workout_data.name

    if "body_weight" in workout_data.model_fields_set:
        workout.body_weight = workout_data.body_weight

    if "notes" in workout_data.model_fields_set:
        workout.notes = workout_data.notes

    db.commit()
    return get_workout_with_relationships(workout.id, db)


@router.post(
    "/{workout_id}/exercises",
    response_model=WorkoutExerciseResponse,
    status_code=201,
)
def add_workout_exercise(
    workout_id: int,
    exercise_data: WorkoutExerciseAdd,
    db: Session = Depends(get_db),
):
    workout = ensure_workout_is_active(workout_id, db)
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_data.exercise_id)
        .first()
    )

    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    duplicate = (
        db.query(WorkoutExercise)
        .filter(
            WorkoutExercise.workout_id == workout_id,
            WorkoutExercise.exercise_id == exercise_data.exercise_id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Exercise is already in this workout",
        )

    latest_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.workout_id == workout_id)
        .order_by(WorkoutExercise.order.desc())
        .first()
    )
    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=exercise.id,
        order=(latest_exercise.order + 1) if latest_exercise else 1,
    )
    db.add(workout_exercise)
    db.flush()

    for set_number in range(1, exercise_data.target_sets + 1):
        db.add(
            WorkoutSet(
                workout_exercise_id=workout_exercise.id,
                set_number=set_number,
                weight=None,
                reps=0,
            )
        )

    db.commit()
    hydrated_workout = get_workout_with_relationships(workout.id, db)
    return next(
        item for item in hydrated_workout.exercises if item.id == workout_exercise.id
    )


@router.patch("/{workout_id}/exercises/order", status_code=204)
def reorder_workout_exercises(
    workout_id: int,
    order_data: WorkoutExerciseOrderUpdate,
    db: Session = Depends(get_db),
):
    ensure_workout_is_active(workout_id, db)
    workout_exercises = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.workout_id == workout_id)
        .all()
    )
    existing_ids = {item.id for item in workout_exercises}
    requested_ids = order_data.ordered_exercise_ids

    if len(requested_ids) != len(set(requested_ids)):
        raise HTTPException(
            status_code=400,
            detail="Exercise order contains duplicate IDs",
        )

    if set(requested_ids) != existing_ids:
        raise HTTPException(
            status_code=400,
            detail="Exercise order must contain every workout exercise",
        )

    exercise_by_id = {item.id: item for item in workout_exercises}
    for order, workout_exercise_id in enumerate(requested_ids, start=1):
        exercise_by_id[workout_exercise_id].order = order

    db.commit()
    return Response(status_code=204)


@router.delete("/exercises/{workout_exercise_id}", status_code=204)
def delete_workout_exercise(
    workout_exercise_id: int,
    db: Session = Depends(get_db),
):
    workout_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.id == workout_exercise_id)
        .first()
    )

    if not workout_exercise:
        raise HTTPException(status_code=404, detail="Workout exercise not found")

    ensure_workout_is_active(workout_exercise.workout_id, db)
    workout_id = workout_exercise.workout_id
    (
        db.query(WorkoutSet)
        .filter(WorkoutSet.workout_exercise_id == workout_exercise.id)
        .delete(synchronize_session=False)
    )
    db.delete(workout_exercise)
    db.flush()

    remaining_exercises = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.workout_id == workout_id)
        .order_by(WorkoutExercise.order)
        .all()
    )
    for order, remaining_exercise in enumerate(remaining_exercises, start=1):
        remaining_exercise.order = order

    db.commit()
    return Response(status_code=204)


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
        workout.completed_at = utc_now()

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

    workout_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.id == workout_set.workout_exercise_id)
        .first()
    )
    ensure_workout_is_active(workout_exercise.workout_id, db)

    if "weight" in set_data.model_fields_set:
        workout_set.weight = set_data.weight

    if "reps" in set_data.model_fields_set:
        workout_set.reps = set_data.reps or 0

    if "notes" in set_data.model_fields_set:
        workout_set.notes = set_data.notes

    db.commit()
    db.refresh(workout_set)

    return workout_set


@router.post(
    "/exercises/{workout_exercise_id}/sets",
    response_model=WorkoutSetResponse,
    status_code=201,
)
def add_workout_set(
    workout_exercise_id: int,
    db: Session = Depends(get_db),
):
    workout_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.id == workout_exercise_id)
        .first()
    )

    if not workout_exercise:
        raise HTTPException(
            status_code=404,
            detail="Workout exercise not found",
        )

    ensure_workout_is_active(workout_exercise.workout_id, db)
    latest_set = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.workout_exercise_id == workout_exercise_id)
        .order_by(WorkoutSet.set_number.desc())
        .first()
    )
    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise_id,
        set_number=(latest_set.set_number + 1) if latest_set else 1,
        weight=None,
        reps=0,
    )
    db.add(workout_set)
    db.commit()
    db.refresh(workout_set)
    return workout_set


@router.delete("/sets/{set_id}", status_code=204)
def delete_workout_set(
    set_id: int,
    db: Session = Depends(get_db),
):
    workout_set = db.query(WorkoutSet).filter(WorkoutSet.id == set_id).first()

    if not workout_set:
        raise HTTPException(status_code=404, detail="Workout set not found")

    workout_exercise = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.id == workout_set.workout_exercise_id)
        .first()
    )
    ensure_workout_is_active(workout_exercise.workout_id, db)
    workout_exercise_id = workout_set.workout_exercise_id
    db.delete(workout_set)
    db.flush()

    remaining_sets = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.workout_exercise_id == workout_exercise_id)
        .order_by(WorkoutSet.set_number)
        .all()
    )
    for set_number, remaining_set in enumerate(remaining_sets, start=1):
        remaining_set.set_number = set_number

    db.commit()
    return Response(status_code=204)
