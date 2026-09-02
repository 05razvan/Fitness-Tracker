from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    primary_muscle: str = Field(min_length=1, max_length=100)
    secondary_muscles: str | None = Field(default=None, max_length=500)
    movement_pattern: str | None = Field(default=None, max_length=100)
    equipment: str | None = Field(default=None, max_length=100)
    exercise_type: str = Field(min_length=1, max_length=50)
    category: str = Field(min_length=1, max_length=50)

    @field_validator(
        "name",
        "primary_muscle",
        "secondary_muscles",
        "movement_pattern",
        "equipment",
        "exercise_type",
        "category",
        mode="before",
    )
    @classmethod
    def strip_text(cls, value):
        return value.strip() if value is not None else None


class ExerciseUpdate(ExerciseCreate):
    pass


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
    rpe: float | None = None
    rir: int | None = None


class ExerciseHistoryEntry(BaseModel):
    workout_id: int
    date: datetime
    sets: list[ExerciseHistorySet]


class ExerciseHistorySetDetailed(BaseModel):
    weight: float | None = None
    reps: int | None = None
    rpe: float | None = None
    rir: int | None = None
    estimated_1rm: float | None = None
    volume: float | None = None


class ExerciseHistoryEntryDetailed(BaseModel):
    workout_id: int
    date: datetime
    sets: list[ExerciseHistorySetDetailed]
    total_volume: float
    best_estimated_1rm: float | None = None


class ExerciseProgressionEntry(BaseModel):
    workout_id: int
    date: datetime
    total_volume: float
    best_estimated_1rm: float | None = None
    best_weight: float | None = None
    best_reps: int | None = None
    average_rpe: float | None = None
    average_rir: float | None = None
    is_pr: bool = False


class ExerciseProgressionResponse(BaseModel):
    exercise_id: int
    exercise_name: str
    personal_best_1rm: float | None = None
    previous_best_1rm: float | None = None
    improvement_percentage: float | None = None
    sessions: list[ExerciseProgressionEntry]


class ExerciseProgressionOverview(ExerciseResponse):
    exercise_name: str
    personal_best_1rm: float | None = None
    previous_best_1rm: float | None = None
    improvement_percentage: float | None = None
    sessions: list[ExerciseProgressionEntry]


class PlateauAnalysis(BaseModel):
    exercise_id: int
    exercise_name: str
    is_plateau: bool
    sessions_analyzed: int
    current_1rm: float | None = None
    best_1rm: float | None = None
    message: str
