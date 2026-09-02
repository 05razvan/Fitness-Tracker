from pydantic import BaseModel, ConfigDict, Field, model_validator


class PresetExerciseCreate(BaseModel):
    exercise_id: int = Field(gt=0)
    order: int = Field(ge=1)
    target_sets: int = Field(default=3, ge=1, le=10)
    target_reps: int = Field(default=8, ge=1, le=100)
    notes: str | None = Field(default=None, max_length=500)


class PresetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = Field(default=None, max_length=1000)
    exercises: list[PresetExerciseCreate] = Field(min_length=1, max_length=30)

    @model_validator(mode="after")
    def validate_exercises(self):
        exercise_ids = [item.exercise_id for item in self.exercises]
        if len(exercise_ids) != len(set(exercise_ids)):
            raise ValueError("A preset cannot contain duplicate exercises")

        orders = [item.order for item in self.exercises]
        if sorted(orders) != list(range(1, len(orders) + 1)):
            raise ValueError("Exercise order must be sequential starting at 1")

        return self


class PresetUpdate(PresetCreate):
    pass


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
