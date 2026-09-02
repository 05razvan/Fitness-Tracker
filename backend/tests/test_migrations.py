import os
import subprocess
import sys

from sqlalchemy import create_engine, inspect


def run_alembic(database_url: str, *args: str):
    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url
    return subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=os.path.dirname(os.path.dirname(__file__)),
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )


def test_migrations_upgrade_and_downgrade_fresh_database(tmp_path):
    database_path = tmp_path / "migration_test.db"
    database_url = f"sqlite:///{database_path}"

    run_alembic(database_url, "upgrade", "head")

    inspector = inspect(create_engine(database_url))
    assert set(inspector.get_table_names()) == {
        "alembic_version",
        "exercises",
        "preset_exercises",
        "users",
        "workout_exercises",
        "workout_presets",
        "workout_sets",
        "workouts",
    }

    run_alembic(database_url, "check")
    run_alembic(database_url, "downgrade", "base")

    remaining_tables = inspect(create_engine(database_url)).get_table_names()
    assert remaining_tables == ["alembic_version"]
