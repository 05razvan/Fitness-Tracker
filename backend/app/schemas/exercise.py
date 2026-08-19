from pydantic import BaseModel, ConfigDict


class ExerciseCreate(BaseModel):
    name: str
    primary_muscle: str
    secondary_muscles: str | None = None
    movement_pattern: str | None = None
    equipment: str | None = None
    exercise_type: str


class ExerciseResponse(BaseModel):
    id: int
    name: str
    primary_muscle: str
    secondary_muscles: str | None
    movement_pattern: str | None
    equipment: str | None
    exercise_type: str

    model_config = ConfigDict(from_attributes=True)
