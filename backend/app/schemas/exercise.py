from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ExerciseCreate(BaseModel):
    name: str
    primary_muscle: str
    secondary_muscles: str | None = None
    movement_pattern: str | None = None
    equipment: str | None = None
    exercise_type: str
    category: str


class ExerciseResponse(BaseModel):
    id: int
    name: str
    primary_muscle: str
    secondary_muscles: str | None
    movement_pattern: str | None
    equipment: str | None
    exercise_type: str
    category: str

    model_config = ConfigDict(from_attributes=True)


class ExerciseHistorySet(BaseModel):
    weight: float | None = None
    reps: int | None = None


class ExerciseHistoryEntry(BaseModel):
    workout_id: int
    date: datetime
    sets: list[ExerciseHistorySet]


class ExerciseHistorySetDetailed(BaseModel):
    weight: float | None = None
    reps: int | None = None
    estimated_1rm: float | None = None
    volume: float | None = None


class ExerciseHistoryEntryDetailed(BaseModel):
    workout_id: int
    date: datetime
    sets: list[ExerciseHistorySetDetailed]
    total_volume: float
    best_estimated_1rm: float | None = None
