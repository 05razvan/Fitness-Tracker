# Fitness Tracker API

## Database setup

Database schema changes are managed with Alembic. From the `backend` directory:

```bash
.venv/bin/alembic upgrade head
```

For a database created before migrations were introduced, back it up and mark
the existing schema as the baseline once:

```bash
.venv/bin/alembic stamp 94011204cb00
```

After that, use `alembic upgrade head` whenever new migrations are pulled.
Application startup does not create or alter tables automatically.

To verify that the ORM models and migrations agree:

```bash
.venv/bin/alembic check
```
