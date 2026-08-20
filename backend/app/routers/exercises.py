from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.exercise import ExerciseHistoryEntry, ExerciseHistorySet, ExerciseHistoryEntryDetailed, ExerciseHistorySetDetailed,  ExerciseCreate, ExerciseResponse


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


@router.get("/", response_model=list[ExerciseResponse])
def get_exercises(
    search: str | None = Query(
        default=None,
        description="Search exercise names",
    ),
    primary_muscle: str | None = Query(
        default=None,
        description="Filter by primary muscle",
    ),
    equipment: str | None = Query(
        default=None,
        description="Filter by equipment",
    ),
    category: str | None = Query(
        default=None,
        description="Filter by category",
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Exercise)

    if search:
        query = query.filter(
            Exercise.name.ilike(f"%{search}%")
        )

    if primary_muscle:
        query = query.filter(
            Exercise.primary_muscle.ilike(primary_muscle)
        )

    if equipment:
        query = query.filter(
            Exercise.equipment.ilike(equipment)
        )

    if category:
        query = query.filter(
            Exercise.category.ilike(category)
        )

    return query.order_by(Exercise.name).all()


@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id)
        .first()
    )

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    return exercise


@router.post(
    "/",
    response_model=ExerciseResponse,
    status_code=201,
)
def create_exercise(
    exercise: ExerciseCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Exercise)
        .filter(Exercise.name == exercise.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Exercise already exists",
        )

    new_exercise = Exercise(**exercise.model_dump())

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise


@router.get(
    "/{exercise_id}/history",
    response_model=list[ExerciseHistoryEntryDetailed],
)
def get_exercise_history(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(Exercise)
        .filter(Exercise.id == exercise_id)
        .first()
    )

    if not exercise:
        raise HTTPException(
            status_code=404,
            detail="Exercise not found",
        )

    workout_exercises = (
        db.query(WorkoutExercise)
        .filter(WorkoutExercise.exercise_id == exercise_id)
        .all()
    )

    history = []

    for workout_exercise in workout_exercises:
        workout = (
            db.query(Workout)
            .filter(Workout.id == workout_exercise.workout_id)
            .first()
        )

        if not workout:
            continue

        sets = (
            db.query(WorkoutSet)
            .filter(
                WorkoutSet.workout_exercise_id == workout_exercise.id
            )
            .order_by(WorkoutSet.set_number)
            .all()
        )

        detailed_sets = []
        total_volume = 0.0
        best_1rm = None

        for workout_set in sets:
            estimated_1rm = None
            volume = None

            if (
                workout_set.weight is not None
                and workout_set.reps is not None
                and workout_set.weight > 0
                and workout_set.reps > 0
            ):
                estimated_1rm = round(
                    workout_set.weight
                    * (1 + workout_set.reps / 30),
                    2,
                )

                volume = round(
                    workout_set.weight * workout_set.reps,
                    2,
                )

                total_volume += volume

                if best_1rm is None or estimated_1rm > best_1rm:
                    best_1rm = estimated_1rm

            detailed_sets.append(
                ExerciseHistorySetDetailed(
                    weight=workout_set.weight,
                    reps=workout_set.reps,
                    estimated_1rm=estimated_1rm,
                    volume=volume,
                )
            )

        history.append(
            ExerciseHistoryEntryDetailed(
                workout_id=workout.id,
                date=workout.started_at,
                sets=detailed_sets,
                total_volume=round(total_volume, 2),
                best_estimated_1rm=best_1rm,
            )
        )

    return history
