from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.exercise import ExerciseHistoryEntry, ExerciseHistorySet, ExerciseHistoryEntryDetailed, ExerciseHistorySetDetailed, ExerciseProgressionEntry, ExerciseProgressionResponse, PlateauAnalysis,  ExerciseCreate, ExerciseResponse


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


@router.get(
    "/{exercise_id}/progression",
    response_model=ExerciseProgressionResponse,
)
def get_exercise_progression(
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

    sessions = []

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

        total_volume = 0.0
        best_1rm = None
        best_weight = None
        best_reps = None

        for workout_set in sets:
            if (
                workout_set.weight is None
                or workout_set.reps is None
                or workout_set.weight <= 0
                or workout_set.reps <= 0
            ):
                continue

            volume = workout_set.weight * workout_set.reps
            total_volume += volume

            estimated_1rm = (
                workout_set.weight
                * (1 + workout_set.reps / 30)
            )

            if best_1rm is None or estimated_1rm > best_1rm:
                best_1rm = estimated_1rm

            if best_weight is None or workout_set.weight > best_weight:
                best_weight = workout_set.weight

            if best_reps is None or workout_set.reps > best_reps:
                best_reps = workout_set.reps

        sessions.append(
            {
                "workout_id": workout.id,
                "date": workout.started_at,
                "total_volume": round(total_volume, 2),
                "best_estimated_1rm": (
                    round(best_1rm, 2)
                    if best_1rm is not None
                    else None
                ),
                "best_weight": best_weight,
                "best_reps": best_reps,
                "is_pr": False,
            }
        )

    sessions.sort(key=lambda x: x["date"])

    personal_best = None

    for session in sessions:
        if session["best_estimated_1rm"] is not None:
            if (
                personal_best is None
                or session["best_estimated_1rm"] > personal_best
            ):
                personal_best = session["best_estimated_1rm"]
                session["is_pr"] = True

    previous_best = None

    if len(sessions) > 1:
        previous_values = [
            s["best_estimated_1rm"]
            for s in sessions[:-1]
            if s["best_estimated_1rm"] is not None
        ]

        if previous_values:
            previous_best = max(previous_values)

    improvement = None

    if (
        personal_best is not None
        and previous_best is not None
        and previous_best > 0
    ):
        improvement = round(
            ((personal_best - previous_best) / previous_best) * 100,
            2,
        )

    return ExerciseProgressionResponse, PlateauAnalysis(
        exercise_id=exercise.id,
        exercise_name=exercise.name,
        personal_best_1rm=personal_best,
        previous_best_1rm=previous_best,
        improvement_percentage=improvement,
        sessions=sessions,
    )


@router.get(
    "/{exercise_id}/plateau",
    response_model=PlateauAnalysis,
)
def detect_exercise_plateau(
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

    session_1rms = []

    for workout_exercise in workout_exercises:
        sets = (
            db.query(WorkoutSet)
            .filter(
                WorkoutSet.workout_exercise_id == workout_exercise.id,
                WorkoutSet.weight.isnot(None),
                WorkoutSet.reps.isnot(None),
            )
            .all()
        )

        best_1rm = None

        for workout_set in sets:
            if workout_set.weight <= 0 or workout_set.reps <= 0:
                continue

            estimated_1rm = (
                workout_set.weight
                * (1 + workout_set.reps / 30)
            )

            if best_1rm is None or estimated_1rm > best_1rm:
                best_1rm = estimated_1rm

        if best_1rm is not None:
            session_1rms.append(best_1rm)

    session_1rms = session_1rms[-3:]

    if not session_1rms:
        return PlateauAnalysis(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            is_plateau=False,
            sessions_analyzed=0,
            current_1rm=None,
            best_1rm=None,
            message="Not enough performance data to detect a plateau.",
        )

    current_1rm = round(session_1rms[-1], 2)
    best_1rm = round(max(session_1rms), 2)

    is_plateau = (
        len(session_1rms) >= 3
        and max(session_1rms) - min(session_1rms) < 1
    )

    if is_plateau:
        message = (
            "Performance has remained stable across the "
            "last 3 sessions. You may be approaching a plateau."
        )
    else:
        message = (
            "Performance is still changing across recent sessions."
        )

    return PlateauAnalysis(
        exercise_id=exercise.id,
        exercise_name=exercise.name,
        is_plateau=is_plateau,
        sessions_analyzed=len(session_1rms),
        current_1rm=current_1rm,
        best_1rm=best_1rm,
        message=message,
    )
