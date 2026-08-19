from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseResponse


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


@router.post("/", response_model=ExerciseResponse, status_code=201)
def create_exercise(
    exercise: ExerciseCreate,
    db: Session = Depends(get_db),
):
    existing_exercise = (
        db.query(Exercise)
        .filter(Exercise.name == exercise.name)
        .first()
    )

    if existing_exercise:
        raise HTTPException(
            status_code=409,
            detail="Exercise already exists",
        )

    new_exercise = Exercise(**exercise.model_dump())

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise


@router.get("/", response_model=list[ExerciseResponse])
def get_exercises(
    db: Session = Depends(get_db),
):
    return db.query(Exercise).order_by(Exercise.name).all()


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
