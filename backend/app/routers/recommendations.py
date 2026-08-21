from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.db.models.workout import Workout, WorkoutExercise, WorkoutSet
from app.schemas.recommendation import ExerciseRecommendation

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
)


@router.get(
    "/exercise/{exercise_id}",
    response_model=ExerciseRecommendation,
)
def get_exercise_recommendation(
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
        .join(Workout)
        .filter(WorkoutExercise.exercise_id == exercise_id)
        .order_by(Workout.started_at.desc())
        .all()
    )

    if not workout_exercises:
        return ExerciseRecommendation(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            recommended_weight=None,
            target_reps_min=8,
            target_reps_max=12,
            target_sets=3,
            recommendation="No recommendation yet",
            reason="Log at least one workout for this exercise first.",
        )

    latest = workout_exercises[0]

    sets = (
        db.query(WorkoutSet)
        .filter(
            WorkoutSet.workout_exercise_id == latest.id,
            WorkoutSet.weight.isnot(None),
            WorkoutSet.reps.isnot(None),
        )
        .order_by(WorkoutSet.set_number)
        .all()
    )

    if not sets:
        return ExerciseRecommendation(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            recommended_weight=None,
            target_reps_min=8,
            target_reps_max=12,
            target_sets=3,
            recommendation="Log your sets first",
            reason="There is not enough completed performance data yet.",
        )

    weights = [s.weight for s in sets]
    reps = [s.reps for s in sets]

    current_weight = max(weights)
    average_reps = sum(reps) / len(reps)

    # ---------------------------------------------------------
    # Check recent performance for plateau detection.
    # ---------------------------------------------------------

    session_1rms = []

    for workout_exercise in workout_exercises:
        historical_sets = (
            db.query(WorkoutSet)
            .filter(
                WorkoutSet.workout_exercise_id == workout_exercise.id,
                WorkoutSet.weight.isnot(None),
                WorkoutSet.reps.isnot(None),
            )
            .all()
        )

        best_1rm = None

        for workout_set in historical_sets:
            estimated_1rm = (
                workout_set.weight
                * (1 + workout_set.reps / 30)
            )

            if best_1rm is None or estimated_1rm > best_1rm:
                best_1rm = estimated_1rm

        if best_1rm is not None:
            session_1rms.append(best_1rm)

    recent_1rms = session_1rms[:3]

    is_plateau = (
        len(recent_1rms) >= 3
        and max(recent_1rms) - min(recent_1rms) < 1
    )

    # ---------------------------------------------------------
    # Plateau-aware recommendation.
    # ---------------------------------------------------------

    if is_plateau:
        return ExerciseRecommendation(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            recommended_weight=current_weight,
            target_reps_min=8,
            target_reps_max=12,
            target_sets=len(sets),
            recommendation=(
                f"Keep the weight at {current_weight:g} kg "
                "and focus on increasing reps."
            ),
            reason=(
                "Your estimated 1RM has remained stable across "
                "your last 3 sessions."
            ),
        )

    # ---------------------------------------------------------
    # Progressive overload recommendation.
    # ---------------------------------------------------------

    if average_reps >= 8:
        if current_weight < 20:
            increase = 1.0
        elif current_weight < 50:
            increase = 2.5
        else:
            increase = 5.0

        recommended_weight = current_weight + increase

        return ExerciseRecommendation(
            exercise_id=exercise.id,
            exercise_name=exercise.name,
            recommended_weight=recommended_weight,
            target_reps_min=6,
            target_reps_max=8,
            target_sets=len(sets),
            recommendation=(
                f"Increase to {recommended_weight:g} kg "
                "and aim for 6–8 reps."
            ),
            reason=(
                f"You averaged {average_reps:.1f} reps at "
                f"{current_weight:g} kg in your latest session."
            ),
        )

    # ---------------------------------------------------------
    # Maintain weight and build reps.
    # ---------------------------------------------------------

    return ExerciseRecommendation(
        exercise_id=exercise.id,
        exercise_name=exercise.name,
        recommended_weight=current_weight,
        target_reps_min=8,
        target_reps_max=10,
        target_sets=len(sets),
        recommendation=(
            f"Keep the weight at {current_weight:g} kg "
            "and aim for 8–10 reps."
        ),
        reason=(
            f"You averaged {average_reps:.1f} reps at "
            f"{current_weight:g} kg in your latest session."
        ),
    )
