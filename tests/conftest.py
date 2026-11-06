"""Test fixtures: an isolated, freshly seeded SQLite database for every test.

DATABASE_URL is set before the app is imported, so the real database
(PostgreSQL or ./inventory.db) is never touched.
"""
import os
import sys
import tempfile

import pytest

_TMP_DIR = tempfile.mkdtemp(prefix="inventory_test_")
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP_DIR, 'test.db')}"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
import seed  # noqa: E402

PASSWORD = "123456"


@pytest.fixture()
def client():
    seed.seed_database()
    with TestClient(app) as c:
        yield c


def _login(client, username, password=PASSWORD):
    r = client.post("/api/auth/login/json", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def login(client):
    return lambda username, password=PASSWORD: _login(client, username, password)


@pytest.fixture()
def admin(login):
    return login("admin")


@pytest.fixture()
def manager(login):
    return login("manager01")


@pytest.fixture()
def staff(login):
    return login("staff01")
