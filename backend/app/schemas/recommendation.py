from pydantic import BaseModel


class ExerciseRecommendation(BaseModel):
    exercise_id: int
    exercise_name: str
    recommended_weight: float | None = None
    target_reps_min: int | None = None
    target_reps_max: int | None = None
    target_sets: int | None = None
    recommendation: str
    reason: str
