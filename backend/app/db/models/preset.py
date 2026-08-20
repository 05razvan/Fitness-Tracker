from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class WorkoutPreset(Base):
    __tablename__ = "workout_presets"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )


class PresetExercise(Base):
    __tablename__ = "preset_exercises"

    id: Mapped[int] = mapped_column(primary_key=True)

    preset_id: Mapped[int] = mapped_column(
        ForeignKey("workout_presets.id"),
        nullable=False,
        index=True,
    )

    exercise_id: Mapped[int] = mapped_column(
        ForeignKey("exercises.id"),
        nullable=False,
        index=True,
    )

    order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    target_sets: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    target_reps: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
