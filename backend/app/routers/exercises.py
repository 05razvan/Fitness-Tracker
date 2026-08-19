from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.exercise import Exercise
from app.schemas.exercise import ExerciseCreate, ExerciseResponse


router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"],
)


@router.get("/", response_model=list[ExerciseResponse])
def get_exercises(
    search: str | None = Query(
        default=None,
        description="Search exercise names",
    ),
    primary_muscle: str | None = Query(
        default=None,
        description="Filter by primary muscle",
    ),
    equipment: str | None = Query(
        default=None,
        description="Filter by equipment",
    ),
    category: str | None = Query(
        default=None,
        description="Filter by category",
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Exercise)

    if search:
        query = query.filter(
            Exercise.name.ilike(f"%{search}%")
        )

    if primary_muscle:
        query = query.filter(
            Exercise.primary_muscle.ilike(primary_muscle)
        )

    if equipment:
        query = query.filter(
            Exercise.equipment.ilike(equipment)
        )

    if category:
        query = query.filter(
            Exercise.category.ilike(category)
        )

    return query.order_by(Exercise.name).all()


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


@router.post(
    "/",
    response_model=ExerciseResponse,
    status_code=201,
)
def create_exercise(
    exercise: ExerciseCreate,
    db: Session = Depends(get_db),
):
    existing = (
        db.query(Exercise)
        .filter(Exercise.name == exercise.name)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Exercise already exists",
        )

    new_exercise = Exercise(**exercise.model_dump())

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise
