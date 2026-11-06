"""The startup migration must upgrade an old database in place without losing data."""
import os
import shutil
import sqlite3
import tempfile

from sqlalchemy import create_engine, inspect

from app.migrations import run_migrations

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _old_schema_db(path):
    con = sqlite3.connect(path)
    con.executescript("""
        CREATE TABLE asset_assignments (
            assignment_id INTEGER PRIMARY KEY, asset_id INTEGER NOT NULL, employee_id INTEGER NOT NULL,
            assigned_by INTEGER NOT NULL, assigned_date DATE NOT NULL, status VARCHAR(30) NOT NULL
        );
        INSERT INTO asset_assignments VALUES (1, 1, 2, 1, '2026-08-01', 'Assigned');
    """)
    con.commit()
    con.close()


def test_migration_adds_expected_return_date_and_keeps_rows():
    path = os.path.join(tempfile.mkdtemp(), "old.db")
    _old_schema_db(path)
    engine = create_engine(f"sqlite:///{path}")

    run_migrations(engine)
    run_migrations(engine)  # idempotent

    cols = {c["name"] for c in inspect(engine).get_columns("asset_assignments")}
    assert "expected_return_date" in cols
    with engine.connect() as conn:
        row = conn.exec_driver_sql("SELECT assigned_date, status, expected_return_date FROM asset_assignments").one()
    assert tuple(row) == ("2026-08-01", "Assigned", None)
    engine.dispose()


def test_migration_on_copy_of_real_inventory_db():
    src = os.path.join(ROOT, "inventory.db")
    if not os.path.exists(src):
        return
    path = os.path.join(tempfile.mkdtemp(), "copy.db")
    shutil.copy(src, path)  # never touch the real file
    engine = create_engine(f"sqlite:///{path}")
    with engine.connect() as conn:
        before = conn.exec_driver_sql("SELECT COUNT(*) FROM asset_assignments").scalar()
    run_migrations(engine)
    assert "expected_return_date" in {c["name"] for c in inspect(engine).get_columns("asset_assignments")}
    with engine.connect() as conn:
        assert conn.exec_driver_sql("SELECT COUNT(*) FROM asset_assignments").scalar() == before
    engine.dispose()
