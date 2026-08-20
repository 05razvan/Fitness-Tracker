from pydantic import BaseModel, ConfigDict


class PresetExerciseCreate(BaseModel):
    exercise_id: int
    order: int
    target_sets: int | None = None
    target_reps: int | None = None
    notes: str | None = None


class PresetCreate(BaseModel):
    name: str
    description: str | None = None
    exercises: list[PresetExerciseCreate] = []


class PresetExerciseResponse(BaseModel):
    id: int
    exercise_id: int
    order: int
    target_sets: int | None
    target_reps: int | None
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class PresetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    exercises: list[PresetExerciseResponse]

    model_config = ConfigDict(from_attributes=True)
