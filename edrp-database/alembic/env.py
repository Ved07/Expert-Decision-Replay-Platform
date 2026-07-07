import sys
import os
from logging.config import fileConfig

from alembic import context

# Make sure Python can find your app's files (database.py, models.py)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base, engine
import models  # noqa: F401 — imported so Alembic can see your table definitions

# This is the Alembic Config object, giving access to values in alembic.ini
config = context.config

# Set up logging, as defined in alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Tell Alembic about your models, so it can detect schema changes
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations without an actual live connection — Alembic just
    writes out the raw SQL instead of executing it. We don't use this
    mode day-to-day, but Alembic's template expects it to exist.
    """
    context.configure(
        url=str(engine.url),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    The mode we actually use: connect to the real database using the
    SAME engine your FastAPI app already uses (built safely in
    database.py via URL.create()), and run migrations against it.
    """
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()