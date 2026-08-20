from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WorkoutSetCreate(BaseModel):
    set_number: int
    weight: float | None = None
    reps: int
    notes: str | None = None


class WorkoutExerciseCreate(BaseModel):
    exercise_id: int
    order: int
    notes: str | None = None
    sets: list[WorkoutSetCreate] = []


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
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class WorkoutExerciseResponse(BaseModel):
    id: int
    exercise_id: int
    order: int
    notes: str | None
    sets: list[WorkoutSetResponse]

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


class WorkoutSetUpdate(BaseModel):
    weight: float | None = None
    reps: int | None = None
    notes: str | None = None
