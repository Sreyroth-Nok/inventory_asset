"""Lightweight schema upgrades for databases created by an older version.

`Base.metadata.create_all` creates missing tables but never adds columns to
tables that already exist. Each entry below adds one column if it is missing,
so existing PostgreSQL / SQLite data is kept without re-seeding.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# (table, column, SQL type) — the type must be valid in both PostgreSQL and SQLite
ADDED_COLUMNS = [
    ("asset_assignments", "expected_return_date", "DATE"),
]


def run_migrations(engine: Engine) -> None:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, column, sql_type in ADDED_COLUMNS:
            if table not in tables:
                continue  # create_all will build it with the column
            existing = {c["name"] for c in inspector.get_columns(table)}
            if column not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {sql_type}"))
                print(f"Migration: added column {table}.{column}")
