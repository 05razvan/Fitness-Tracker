from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkoutSetCreate(BaseModel):
    set_number: int
    weight: float | None = None
    reps: int
    rpe: float | None = Field(default=None, ge=1, le=10)
    rir: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = None


class WorkoutExerciseCreate(BaseModel):
    exercise_id: int
    order: int
    notes: str | None = None
    sets: list[WorkoutSetCreate] = []


class WorkoutExerciseAdd(BaseModel):
    exercise_id: int
    target_sets: int = Field(default=3, ge=1, le=10)


class WorkoutExerciseOrderUpdate(BaseModel):
    ordered_exercise_ids: list[int] = Field(min_length=1)


class WorkoutCreate(BaseModel):
    name: str | None = None
    started_at: datetime | None = None
    body_weight: float | None = None
    notes: str | None = None
    exercises: list[WorkoutExerciseCreate] = []


class WorkoutSetResponse(BaseModel):
    id: int
    set_number: int
    weight: float | None
    reps: int
    rpe: float | None
    rir: int | None
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class WorkoutExerciseResponse(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    order: int
    notes: str | None
    sets: list[WorkoutSetResponse]
    previous_sets: list[WorkoutSetResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class WorkoutResponse(BaseModel):
    id: int
    user_id: int
    name: str | None
    started_at: datetime
    completed_at: datetime | None
    body_weight: float | None
    notes: str | None
    exercises: list[WorkoutExerciseResponse]

    model_config = ConfigDict(from_attributes=True)


class WorkoutUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    body_weight: float | None = Field(default=None, gt=0, le=500)
    notes: str | None = Field(default=None, max_length=2000)


class WorkoutSetUpdate(BaseModel):
    weight: float | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=0)
    rpe: float | None = Field(default=None, ge=1, le=10)
    rir: int | None = Field(default=None, ge=0, le=10)
    notes: str | None = None
