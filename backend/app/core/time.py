from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return naive UTC for the existing timezone-naive database columns."""
    return datetime.now(UTC).replace(tzinfo=None)
