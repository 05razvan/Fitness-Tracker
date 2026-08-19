from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
        index=True,
    )

    primary_muscle: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    secondary_muscles: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    movement_pattern: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    equipment: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    exercise_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
