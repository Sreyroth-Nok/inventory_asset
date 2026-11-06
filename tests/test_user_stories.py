"""Acceptance tests mapped to docs/USER_STORIES.md (story ID in each test name).

Seed data (see seed.py):
  users:       admin (Admin), manager01 (Warehouse Manager), staff01 (Inventory Staff)
  assets:      LAP-001 (Assigned to EMP-002), LAP-002, PRT-001, MON-001 (Available)
  inventory:   INV-001 qty 650/min 100, INV-002 15/30 Low, INV-003 0/20 Out, INV-004 120/25
"""
import pytest

API = "/api"


def get_id(client, headers, path, field, key, value):
    rows = client.get(f"{API}/{path}", headers=headers).json()
    return next(r[field] for r in rows if r[key] == value)


# ---------------------------------------------------------------- Epic A: Auth

def test_US_A1_login_success_returns_token(client):
    r = client.post(f"{API}/auth/login/json", json={"username": "admin", "password": "123456"})
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer" and r.json()["access_token"]


def test_US_A1_oauth2_form_login(client):
    r = client.post(f"{API}/auth/login", data={"username": "staff01", "password": "123456"})
    assert r.status_code == 200


@pytest.mark.parametrize("username,password", [("admin", "wrong"), ("nobody", "123456")])
def test_US_A1_login_bad_credentials_401(client, username, password):
    r = client.post(f"{API}/auth/login/json", json={"username": username, "password": password})
    assert r.status_code == 401
    assert r.json()["detail"] == "Incorrect username or password"


def test_US_A1_inactive_user_cannot_login(client, admin):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    assert client.put(f"{API}/users/{uid}", json={"status": "Inactive"}, headers=admin).status_code == 200
    r = client.post(f"{API}/auth/login/json", json={"username": "staff01", "password": "123456"})
    assert r.status_code == 403


def test_US_A1_login_is_recorded_in_user_log(client, admin):
    logs = client.get(f"{API}/reports/user-logs", params={"username": "admin"}, headers=admin).json()
    assert len(logs) >= 1 and logs[0]["status"] == "Active"


def test_US_A2_me_returns_profile_and_role(client, manager):
    r = client.get(f"{API}/auth/me", headers=manager)
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == "manager01"
    assert body["role"] == "Warehouse Manager"
    assert body["employee"]["employee_code"] == "EMP-004"


@pytest.mark.parametrize("headers", [{}, {"Authorization": "Bearer not-a-real-token"}])
def test_US_A2_me_requires_valid_token(client, headers):
    assert client.get(f"{API}/auth/me", headers=headers).status_code == 401


def test_US_A3_logout_closes_session_log(client, staff, admin):
    assert client.post(f"{API}/auth/logout", headers=staff).status_code == 200
    logs = client.get(f"{API}/reports/user-logs", params={"username": "staff01"}, headers=admin).json()
    assert logs[0]["status"] == "Logged Out"
    assert logs[0]["logout_time"] != "-"
    assert logs[0]["session_duration"].endswith("mins")


# ------------------------------------------------------ Epic A4: role checks

def test_US_A4_staff_cannot_manage_users_or_roles(client, staff):
    r = client.post(f"{API}/users", json={"username": "x", "email": "x@x.com", "password": "p"}, headers=staff)
    assert r.status_code == 403
    assert client.post(f"{API}/roles", json={"role_name": "X"}, headers=staff).status_code == 403


def test_US_A4_staff_cannot_delete_records(client, staff):
    assert client.delete(f"{API}/assets/2", headers=staff).status_code == 403
    assert client.delete(f"{API}/inventory/4", headers=staff).status_code == 403


def test_US_A4_staff_cannot_create_department(client, staff):
    r = client.post(f"{API}/departments", json={"department_name": "Ops"}, headers=staff)
    assert r.status_code == 403


def test_US_A4_warehouse_manager_can_create_department(client, manager):
    r = client.post(f"{API}/departments", json={"department_name": "Logistics"}, headers=manager)
    assert r.status_code == 201, r.text


def test_US_A4_warehouse_manager_can_do_daily_operations(client, manager):
    """Warehouse Manager must be able to create assets, assign them and move stock."""
    r = client.post(f"{API}/assets", json={
        "asset_code": "MGR-001", "asset_name": "Manager Laptop", "category_id": 1, "supplier_id": 1,
    }, headers=manager)
    assert r.status_code == 201, r.text
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": r.json()["asset_id"], "employee_id": 1}, headers=manager)
    assert r.status_code == 201, r.text
    r = client.post(f"{API}/stock-transactions/stock-in", json={"inventory_id": 1, "quantity": 5}, headers=manager)
    assert r.status_code == 201, r.text
    r = client.post(f"{API}/suppliers", json={"supplier_name": "New Vendor"}, headers=manager)
    assert r.status_code == 201, r.text


def test_US_A4_warehouse_manager_cannot_delete(client, manager):
    assert client.delete(f"{API}/assets/2", headers=manager).status_code == 403


# --------------------------------------------------- Epic B: user/role admin

def test_US_B1_admin_creates_user_and_new_user_can_login(client, admin, login):
    r = client.post(f"{API}/users", json={
        "username": "staff02", "email": "staff02@company.com", "password": "pass1234",
        "role": "Inventory Staff", "employee_id": 2,
    }, headers=admin)
    assert r.status_code == 201, r.text
    assert "password" not in r.json()
    me = client.get(f"{API}/auth/me", headers=login("staff02", "pass1234")).json()
    assert me["role"] == "Inventory Staff"


def test_US_B1_duplicate_username_or_email_rejected(client, admin):
    base = {"password": "p", "role": "Inventory Staff"}
    r = client.post(f"{API}/users", json={**base, "username": "admin", "email": "new@x.com"}, headers=admin)
    assert r.status_code == 400
    r = client.post(f"{API}/users", json={**base, "username": "newbie", "email": "admin@company.com"}, headers=admin)
    assert r.status_code == 400


def test_US_B1_unknown_employee_rejected(client, admin):
    r = client.post(f"{API}/users", json={
        "username": "ghost", "email": "ghost@x.com", "password": "p", "employee_id": 9999,
    }, headers=admin)
    assert r.status_code == 404


def test_US_B1_unknown_role_rejected(client, admin):
    r = client.post(f"{API}/users", json={
        "username": "norole", "email": "norole@x.com", "password": "p", "role": "Super Hero",
    }, headers=admin)
    assert r.status_code in (400, 404), r.text


def test_US_B1_password_stored_hashed(client, admin):
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    try:
        pwd = db.query(User).filter(User.username == "admin").first().password
    finally:
        db.close()
    assert pwd != "123456" and pwd.startswith("$2")


def test_US_B2_admin_changes_user_role(client, admin, login):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    r = client.put(f"{API}/users/{uid}", json={"role": "Warehouse Manager"}, headers=admin)
    assert r.status_code == 200, r.text
    assert r.json()["role"] == "Warehouse Manager"
    assert client.get(f"{API}/auth/me", headers=login("staff01")).json()["role"] == "Warehouse Manager"


def test_US_B2_edit_form_payload_from_web_ui(client, admin):
    """The Users page sends username/email/role/status/phone/gender (no password) on edit."""
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    r = client.put(f"{API}/users/{uid}", json={
        "username": "staff01", "email": "staff01@company.com", "role": "Inventory Staff",
        "status": "Active", "phone": "012345680", "gender": "Male",
    }, headers=admin)
    assert r.status_code == 200, r.text


def test_US_B2_change_password(client, admin, login):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    assert client.put(f"{API}/users/{uid}", json={"password": "newpass"}, headers=admin).status_code == 200
    login("staff01", "newpass")
    r = client.post(f"{API}/auth/login/json", json={"username": "staff01", "password": "123456"})
    assert r.status_code == 401


def test_US_B2_deactivated_user_token_stops_working(client, admin, staff):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    client.put(f"{API}/users/{uid}", json={"status": "Inactive"}, headers=admin)
    assert client.get(f"{API}/auth/me", headers=staff).status_code == 403


def test_US_B3_admin_deletes_user(client, admin):
    r = client.post(f"{API}/users", json={"username": "temp", "email": "temp@x.com", "password": "p"}, headers=admin)
    uid = r.json()["user_id"]
    assert client.delete(f"{API}/users/{uid}", headers=admin).status_code == 204
    assert client.get(f"{API}/users/{uid}", headers=admin).status_code == 404


def test_US_B3_delete_user_with_login_history_does_not_crash(client, admin, staff):
    """staff01 has logged in (user_logs) and created records; delete must not return 500."""
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    r = client.delete(f"{API}/users/{uid}", headers=admin)
    assert r.status_code in (204, 400, 409), f"{r.status_code}: {r.text}"


def test_US_B1_B2_phone_and_gender_are_saved(client, admin):
    r = client.post(f"{API}/users", json={
        "username": "pg", "email": "pg@x.com", "password": "p", "phone": "011222333", "gender": "Female",
    }, headers=admin)
    assert (r.json()["phone"], r.json()["gender"]) == ("011222333", "Female")
    r = client.put(f"{API}/users/{r.json()['user_id']}", json={"phone": "099"}, headers=admin)
    assert r.json()["phone"] == "099"


def test_US_B2_update_rejects_unknown_role_and_duplicates(client, admin):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    assert client.put(f"{API}/users/{uid}", json={"role": "Super Hero"}, headers=admin).status_code == 404
    assert client.put(f"{API}/users/{uid}", json={"username": "admin"}, headers=admin).status_code == 400
    assert client.put(f"{API}/users/{uid}", json={"email": "admin@company.com"}, headers=admin).status_code == 400


def test_US_B2_blank_password_keeps_current(client, admin, login):
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    assert client.put(f"{API}/users/{uid}", json={"password": ""}, headers=admin).status_code == 200
    login("staff01", "123456")


def test_US_B3_admin_cannot_delete_self(client, admin):
    uid = get_id(client, admin, "users", "user_id", "username", "admin")
    assert client.delete(f"{API}/users/{uid}", headers=admin).status_code == 400


def test_US_B4_manage_roles(client, admin):
    r = client.post(f"{API}/roles", json={"role_name": "Auditor", "description": "Read only"}, headers=admin)
    assert r.status_code == 201
    rid = r.json()["role_id"]
    assert client.post(f"{API}/roles", json={"role_name": "Auditor"}, headers=admin).status_code == 400
    r = client.put(f"{API}/roles/{rid}", json={"description": "Reads reports"}, headers=admin)
    assert r.json()["description"] == "Reads reports"
    assert client.delete(f"{API}/roles/{rid}", headers=admin).status_code == 204


# ------------------------------------------------------ Epic C: master data

def test_US_C1_department_crud(client, admin):
    r = client.post(f"{API}/departments", json={"department_name": "Sales", "description": "Sales team"}, headers=admin)
    assert r.status_code == 201
    did = r.json()["department_id"]
    r = client.put(f"{API}/departments/{did}", json={"status": "Inactive"}, headers=admin)
    assert r.json()["status"] == "Inactive"
    active = client.get(f"{API}/departments", params={"status_filter": "Active"}, headers=admin).json()
    assert did not in [d["department_id"] for d in active]
    assert client.delete(f"{API}/departments/{did}", headers=admin).status_code == 204
    assert client.get(f"{API}/departments/{did}", headers=admin).status_code == 404


def test_US_C2_employee_create_search_filter(client, staff):
    r = client.post(f"{API}/employees", json={
        "employee_code": "EMP-100", "employee_name": "Rithy", "department_id": 3, "position": "Accountant",
    }, headers=staff)
    assert r.status_code == 201, r.text
    assert r.json()["department"]["department_name"] == "Finance"
    found = client.get(f"{API}/employees", params={"search": "rith"}, headers=staff).json()
    assert [e["employee_code"] for e in found] == ["EMP-100"]
    it = client.get(f"{API}/employees", params={"department_id": 1}, headers=staff).json()
    assert len(it) == 3


def test_US_C2_employee_validation(client, staff):
    r = client.post(f"{API}/employees", json={"employee_code": "EMP-001", "employee_name": "Dup", "department_id": 1}, headers=staff)
    assert r.status_code == 400
    r = client.post(f"{API}/employees", json={"employee_code": "EMP-200", "employee_name": "X", "department_id": 999}, headers=staff)
    assert r.status_code == 404


def test_US_C2_delete_employee_with_assignment_history_does_not_crash(client, admin):
    """EMP-002 holds LAP-001; deleting must be refused cleanly, not crash with 500."""
    emp_id = get_id(client, admin, "employees", "employee_id", "employee_code", "EMP-002")
    r = client.delete(f"{API}/employees/{emp_id}", headers=admin)
    assert r.status_code in (400, 409), f"{r.status_code}: {r.text}"


def test_US_C3_supplier_crud_and_search(client, staff, admin):
    r = client.post(f"{API}/suppliers", json={"supplier_name": "Mekong Office", "contact_person": "Ms. Srey"}, headers=staff)
    assert r.status_code == 201
    sid = r.json()["supplier_id"]
    found = client.get(f"{API}/suppliers", params={"search": "srey"}, headers=staff).json()
    assert [s["supplier_id"] for s in found] == [sid]
    assert client.put(f"{API}/suppliers/{sid}", json={"phone": "099"}, headers=staff).json()["phone"] == "099"
    assert client.delete(f"{API}/suppliers/{sid}", headers=admin).status_code == 204


def test_US_C4_category_crud(client, staff, admin):
    r = client.post(f"{API}/categories", json={"category_name": "Tablet"}, headers=staff)
    assert r.status_code == 201
    cid = r.json()["category_id"]
    assert client.put(f"{API}/categories/{cid}", json={"description": "iPads"}, headers=staff).json()["description"] == "iPads"
    assert client.delete(f"{API}/categories/{cid}", headers=admin).status_code == 204


# ---------------------------------------------------------- Epic D: assets

NEW_ASSET = {
    "asset_code": "LAP-100", "asset_name": "Lenovo ThinkPad X1", "category_id": 1, "supplier_id": 1,
    "serial_number": "LN-555", "purchase_date": "2026-05-01", "purchase_price": 1200.50,
    "condition": "Excellent", "status": "Available",
}


def test_US_D1_register_asset(client, staff):
    r = client.post(f"{API}/assets", json=NEW_ASSET, headers=staff)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["category"]["category_name"] == "Laptop"
    assert body["supplier"]["supplier_name"] == "ABC Technology"
    assert float(body["purchase_price"]) == 1200.50


def test_US_D1_asset_validation(client, staff):
    assert client.post(f"{API}/assets", json={**NEW_ASSET, "asset_code": "LAP-001"}, headers=staff).status_code == 400
    assert client.post(f"{API}/assets", json={**NEW_ASSET, "category_id": 999}, headers=staff).status_code == 404
    assert client.post(f"{API}/assets", json={**NEW_ASSET, "supplier_id": 999}, headers=staff).status_code == 404


def test_US_D2_search_and_filter_assets(client, staff):
    assert [a["asset_code"] for a in client.get(f"{API}/assets", params={"search": "HP987"}, headers=staff).json()] == ["LAP-002"]
    laptops = client.get(f"{API}/assets", params={"category_id": 1}, headers=staff).json()
    assert {a["asset_code"] for a in laptops} == {"LAP-001", "LAP-002"}
    avail = client.get(f"{API}/assets", params={"status_filter": "Available"}, headers=staff).json()
    assert len(avail) == 3


def test_US_D2_assigned_asset_shows_holder(client, staff):
    lap1 = next(a for a in client.get(f"{API}/assets", headers=staff).json() if a["asset_code"] == "LAP-001")
    assert lap1["assigned_to"]["employee_code"] == "EMP-002"
    detail = client.get(f"{API}/assets/{lap1['asset_id']}", headers=staff).json()
    assert detail["assigned_to"]["employee_name"] == "Sokha"


def test_US_D3_edit_asset(client, staff):
    r = client.put(f"{API}/assets/2", json={"condition": "Fair", "description": "Scratched"}, headers=staff)
    assert r.status_code == 200
    assert r.json()["condition"] == "Fair"


def test_US_D3_admin_deletes_unused_asset(client, admin):
    aid = client.post(f"{API}/assets", json=NEW_ASSET, headers=admin).json()["asset_id"]
    assert client.delete(f"{API}/assets/{aid}", headers=admin).status_code == 204
    assert client.get(f"{API}/assets/{aid}", headers=admin).status_code == 404


def test_US_D3_delete_asset_with_history_does_not_crash(client, admin):
    """LAP-001 has an assignment record; deleting must be refused cleanly, not crash with 500."""
    r = client.delete(f"{API}/assets/1", headers=admin)
    assert r.status_code in (400, 409), f"{r.status_code}: {r.text}"


def test_US_D4_D5_assign_and_return_full_cycle(client, staff):
    # Assign LAP-002 to Dara (EMP-001)
    r = client.post(f"{API}/asset-assignments/assign", json={
        "asset_id": 2, "employee_id": 1, "condition_on_assignment": "Excellent", "remarks": "New hire kit",
    }, headers=staff)
    assert r.status_code == 201, r.text
    assignment = r.json()
    assert assignment["status"] == "Assigned"
    assert assignment["assigner"]["username"] == "staff01"
    assert client.get(f"{API}/assets/2", headers=staff).json()["status"] == "Assigned"

    # Cannot assign again while assigned
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 3}, headers=staff)
    assert r.status_code == 400 and "Assigned" in r.json()["detail"]

    # Shows in active list
    active = client.get(f"{API}/asset-assignments/active", headers=staff).json()
    assert assignment["assignment_id"] in [a["assignment_id"] for a in active]

    # Return as damaged
    r = client.post(f"{API}/asset-assignments/{assignment['assignment_id']}/return", json={
        "condition_on_return": "Damaged", "status_on_return": "Damaged", "remarks": "Cracked screen",
    }, headers=staff)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "Returned" and r.json()["returned_date"]
    asset = client.get(f"{API}/assets/2", headers=staff).json()
    assert asset["status"] == "Damaged" and asset["condition"] == "Damaged"

    # Double return refused
    r = client.post(f"{API}/asset-assignments/{assignment['assignment_id']}/return", json={}, headers=staff)
    assert r.status_code == 400

    # Damaged asset cannot be assigned
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1}, headers=staff)
    assert r.status_code == 400


def test_US_D4_assign_validation(client, staff):
    assert client.post(f"{API}/asset-assignments/assign", json={"asset_id": 999, "employee_id": 1}, headers=staff).status_code == 404
    assert client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 999}, headers=staff).status_code == 404
    assert client.post(f"{API}/asset-assignments/999/return", json={}, headers=staff).status_code == 404


def test_US_D3_assigned_asset_status_cannot_be_edited(client, staff):
    """LAP-001 (id 1) is assigned; changing its status by edit would orphan the assignment."""
    r = client.put(f"{API}/assets/1", json={"status": "Available"}, headers=staff)
    assert r.status_code == 400 and "Return it first" in r.json()["detail"]
    assert client.get(f"{API}/asset-assignments/active", headers=staff).json()[0]["asset_id"] == 1
    # Other fields (and the unchanged status, as the web form sends it) still save
    r = client.put(f"{API}/assets/1", json={"status": "Assigned", "description": "Dev laptop"}, headers=staff)
    assert r.status_code == 200 and r.json()["description"] == "Dev laptop"


def test_US_D3_status_assigned_only_via_assign(client, staff):
    r = client.put(f"{API}/assets/2", json={"status": "Assigned"}, headers=staff)
    assert r.status_code == 400
    r = client.post(f"{API}/assets", json={**NEW_ASSET, "status": "Assigned"}, headers=staff)
    assert r.status_code == 400
    assert client.put(f"{API}/assets/2", json={"status": "Under Maintenance"}, headers=staff).status_code == 200


def test_US_D4_inactive_employee_cannot_receive_asset(client, staff):
    client.put(f"{API}/employees/1", json={"status": "Inactive"}, headers=staff)
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1}, headers=staff)
    assert r.status_code == 400 and "Inactive" in r.json()["detail"]
    assert client.get(f"{API}/assets/2", headers=staff).json()["status"] == "Available"


def _days(n):
    from datetime import date, timedelta
    return (date.today() + timedelta(days=n)).isoformat()


def test_US_D4_assign_with_dates_and_optional_due_date(client, staff):
    # Permanent handover: no expected return date
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1}, headers=staff)
    assert r.status_code == 201
    assert r.json()["assigned_date"] == _days(0)
    assert r.json()["expected_return_date"] is None and r.json()["is_overdue"] is False

    # Loan with a chosen assigned date and a due date
    r = client.post(f"{API}/asset-assignments/assign", json={
        "asset_id": 3, "employee_id": 4, "assigned_date": _days(-3), "expected_return_date": _days(4),
    }, headers=staff)
    assert r.status_code == 201, r.text
    assert (r.json()["assigned_date"], r.json()["expected_return_date"]) == (_days(-3), _days(4))
    holder = client.get(f"{API}/assets/3", headers=staff).json()["assigned_to"]
    assert holder["expected_return_date"] == _days(4) and holder["is_overdue"] is False


def test_US_D4_assign_date_validation(client, staff):
    r = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1, "assigned_date": _days(1)}, headers=staff)
    assert r.status_code == 400 and "future" in r.json()["detail"]
    r = client.post(f"{API}/asset-assignments/assign", json={
        "asset_id": 2, "employee_id": 1, "assigned_date": _days(-2), "expected_return_date": _days(-5),
    }, headers=staff)
    assert r.status_code == 400 and "before the assigned date" in r.json()["detail"]
    assert client.get(f"{API}/assets/2", headers=staff).json()["status"] == "Available"


def test_US_D5_return_date_validation_and_default(client, staff):
    a = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1, "assigned_date": _days(-5)}, headers=staff).json()
    url = f"{API}/asset-assignments/{a['assignment_id']}/return"
    assert client.post(url, json={"returned_date": _days(-6)}, headers=staff).status_code == 400
    assert client.post(url, json={"returned_date": _days(1)}, headers=staff).status_code == 400
    r = client.post(url, json={"returned_date": _days(-1)}, headers=staff)
    assert r.status_code == 200 and r.json()["returned_date"] == _days(-1)

    b = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1}, headers=staff).json()
    r = client.post(f"{API}/asset-assignments/{b['assignment_id']}/return", json={}, headers=staff)
    assert r.json()["returned_date"] == _days(0)


def test_US_D7_overdue_detection_everywhere(client, staff, admin):
    a = client.post(f"{API}/asset-assignments/assign", json={
        "asset_id": 3, "employee_id": 5, "assigned_date": _days(-10), "expected_return_date": _days(-2),
    }, headers=staff).json()
    assert a["is_overdue"] is True
    assert client.get(f"{API}/assets/3", headers=staff).json()["assigned_to"]["is_overdue"] is True

    overdue = client.get(f"{API}/asset-assignments", params={"status_filter": "Overdue"}, headers=staff).json()
    assert [o["assignment_id"] for o in overdue] == [a["assignment_id"]]
    assert client.get(f"{API}/dashboard/stats", headers=staff).json()["asset_summary"]["overdue_assignments"] == 1
    report = client.get(f"{API}/reports/asset-history", params={"status_filter": "Overdue"}, headers=admin).json()
    assert len(report) == 1 and report[0]["is_overdue"] is True and report[0]["expected_return_date"] == _days(-2)

    # Extending the due date clears overdue
    r = client.put(f"{API}/asset-assignments/{a['assignment_id']}", json={"expected_return_date": _days(7)}, headers=staff)
    assert r.status_code == 200 and r.json()["is_overdue"] is False
    assert client.get(f"{API}/dashboard/stats", headers=staff).json()["asset_summary"]["overdue_assignments"] == 0

    # Returned assignments are never overdue and cannot be edited
    client.put(f"{API}/asset-assignments/{a['assignment_id']}", json={"expected_return_date": _days(-1)}, headers=staff)
    r = client.post(f"{API}/asset-assignments/{a['assignment_id']}/return", json={}, headers=staff)
    assert r.json()["is_overdue"] is False
    assert client.put(f"{API}/asset-assignments/{a['assignment_id']}", json={"remarks": "x"}, headers=staff).status_code == 400


def test_US_D7_extend_due_date_validation(client, staff):
    a = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1, "assigned_date": _days(-3)}, headers=staff).json()
    url = f"{API}/asset-assignments/{a['assignment_id']}"
    assert client.put(url, json={"expected_return_date": _days(-4)}, headers=staff).status_code == 400
    r = client.put(url, json={"expected_return_date": None}, headers=staff)
    assert r.status_code == 200 and r.json()["expected_return_date"] is None
    assert client.put(f"{API}/asset-assignments/999", json={}, headers=staff).status_code == 404


def test_US_D6_assignment_history_filters(client, staff):
    a = client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 1, "assigned_date": _days(-20)}, headers=staff).json()
    client.post(f"{API}/asset-assignments/{a['assignment_id']}/return", json={"returned_date": _days(-15)}, headers=staff)
    client.post(f"{API}/asset-assignments/assign", json={"asset_id": 2, "employee_id": 4}, headers=staff)

    get = lambda **p: client.get(f"{API}/asset-assignments", params=p, headers=staff).json()
    history = get(asset_id=2)
    assert [h["status"] for h in history] == ["Assigned", "Returned"]  # newest first
    assert history[1]["returned_date"] == _days(-15)
    assert len(get(status_filter="Returned")) == 1
    assert len(get(status_filter="Assigned")) == 2  # incl. seed LAP-001
    assert {h["employee"]["employee_code"] for h in get(search="dara")} == {"EMP-001"}
    assert len(get(search="LAP-002")) == 2
    assert len(get(start_date=_days(-1))) == 1
    assert len(get(employee_id=4)) == 1


def test_US_D6_active_assignments(client, manager):
    active = client.get(f"{API}/asset-assignments/active", headers=manager).json()
    assert len(active) == 1 and active[0]["asset"]["asset_code"] == "LAP-001"


# ------------------------------------------------------- Epic E: inventory

def test_US_E1_inventory_status_is_automatic(client, staff):
    base = {"item_name": "Stapler", "supplier_id": 1, "minimum_stock": 10, "unit": "Piece"}
    cases = [("STP-1", 0, "Out of Stock"), ("STP-2", 5, "Low Stock"), ("STP-3", 10, "Available")]
    for code, qty, expected in cases:
        r = client.post(f"{API}/inventory", json={**base, "item_code": code, "quantity": qty}, headers=staff)
        assert r.status_code == 201, r.text
        assert r.json()["status"] == expected, code
    assert client.post(f"{API}/inventory", json={**base, "item_code": "STP-1"}, headers=staff).status_code == 400


def test_US_E1_inactive_status_is_kept(client, staff):
    r = client.put(f"{API}/inventory/4", json={"status": "Inactive"}, headers=staff)
    assert r.json()["status"] == "Inactive"
    client.post(f"{API}/stock-transactions/stock-in", json={"inventory_id": 4, "quantity": 1}, headers=staff)
    assert client.get(f"{API}/inventory/4", headers=staff).json()["status"] == "Inactive"


def test_US_E1_search_and_filter_inventory(client, staff):
    low = client.get(f"{API}/inventory", params={"status_filter": "Low Stock"}, headers=staff).json()
    assert [i["item_code"] for i in low] == ["INV-002"]
    assert len(client.get(f"{API}/inventory", params={"category": "IT Accessories"}, headers=staff).json()) == 2
    assert [i["item_code"] for i in client.get(f"{API}/inventory", params={"search": "mouse"}, headers=staff).json()] == ["INV-004"]


def test_US_E2_stock_in_increases_quantity_and_status(client, staff):
    # INV-003: 0 / min 20 (Out of Stock)
    r = client.post(f"{API}/stock-transactions/stock-in", json={
        "inventory_id": 3, "quantity": 5, "reference": "PO-1", "reason": "Restock",
    }, headers=staff)
    assert r.status_code == 201
    assert r.json()["transaction_type"] == "Stock In"
    item = client.get(f"{API}/inventory/3", headers=staff).json()
    assert item["quantity"] == 5 and item["status"] == "Low Stock"
    client.post(f"{API}/stock-transactions/stock-in", json={"inventory_id": 3, "quantity": 15}, headers=staff)
    assert client.get(f"{API}/inventory/3", headers=staff).json()["status"] == "Available"


@pytest.mark.parametrize("qty", [0, -5])
def test_US_E2_E3_quantity_must_be_positive(client, staff, qty):
    for kind in ("stock-in", "stock-out"):
        r = client.post(f"{API}/stock-transactions/{kind}", json={"inventory_id": 1, "quantity": qty}, headers=staff)
        assert r.status_code == 422


def test_US_E3_stock_out_decreases_and_blocks_overdraw(client, staff):
    # INV-002: 15 / min 30
    r = client.post(f"{API}/stock-transactions/stock-out", json={"inventory_id": 2, "quantity": 16}, headers=staff)
    assert r.status_code == 400 and "Insufficient stock" in r.json()["detail"]
    assert client.get(f"{API}/inventory/2", headers=staff).json()["quantity"] == 15

    r = client.post(f"{API}/stock-transactions/stock-out", json={"inventory_id": 2, "quantity": 15}, headers=staff)
    assert r.status_code == 201
    item = client.get(f"{API}/inventory/2", headers=staff).json()
    assert item["quantity"] == 0 and item["status"] == "Out of Stock"


def test_US_E3_stock_unknown_item(client, staff):
    assert client.post(f"{API}/stock-transactions/stock-in", json={"inventory_id": 999, "quantity": 1}, headers=staff).status_code == 404
    assert client.post(f"{API}/stock-transactions/stock-out", json={"inventory_id": 999, "quantity": 1}, headers=staff).status_code == 404


def test_US_E4_transaction_history_filters(client, staff):
    assert len(client.get(f"{API}/stock-transactions", headers=staff).json()) == 3
    assert len(client.get(f"{API}/stock-transactions", params={"inventory_id": 1}, headers=staff).json()) == 2
    outs = client.get(f"{API}/stock-transactions", params={"transaction_type": "Stock Out"}, headers=staff).json()
    assert len(outs) == 2 and all(t["transaction_type"] == "Stock Out" for t in outs)


def test_US_E1_delete_item_with_transactions_does_not_crash(client, admin):
    """INV-001 has stock transactions; deleting must be refused cleanly, not crash with 500."""
    r = client.delete(f"{API}/inventory/1", headers=admin)
    assert r.status_code in (400, 409), f"{r.status_code}: {r.text}"


# ------------------------------------------------- Epic F: dashboard/reports

def test_US_F1_dashboard_stats(client, staff):
    r = client.get(f"{API}/dashboard/stats", headers=staff)
    assert r.status_code == 200, r.text
    d = r.json()
    assert (d["total_users"], d["total_employees"], d["total_departments"], d["total_suppliers"]) == (3, 5, 5, 3)
    assert d["asset_summary"] == {
        "total_assets": 4, "available_assets": 3, "assigned_assets": 1,
        "under_maintenance_assets": 0, "damaged_assets": 0, "other_assets": 0,
        "overdue_assignments": 0,
    }
    assert d["inventory_summary"] == {"total_items": 4, "available_items": 2, "low_stock_items": 1, "out_of_stock_items": 1}
    assert len(d["recent_transactions"]) == 3 and len(d["recent_assignments"]) == 1


def test_US_F1_dashboard_reflects_new_activity(client, staff):
    client.post(f"{API}/asset-assignments/assign", json={"asset_id": 3, "employee_id": 5}, headers=staff)
    d = client.get(f"{API}/dashboard/stats", headers=staff).json()
    assert d["asset_summary"]["assigned_assets"] == 2


def test_US_F1_dashboard_every_number_is_live(client, admin):
    """Each dashboard figure must move when the underlying data changes (no hard-coded values)."""
    before = client.get(f"{API}/dashboard/stats", headers=admin).json()
    assert before["active_users"] == 3
    assert len(before["stock_trend"]) == 6
    this_month = before["stock_trend"][-1]
    # seed transactions are dated "now" -> 200 in, 60 out this month
    assert (this_month["stock_in"], this_month["stock_out"]) == (200, 60)
    assert all(p["stock_in"] == 0 and p["stock_out"] == 0 for p in before["stock_trend"][:-1])

    # Change data
    client.post(f"{API}/stock-transactions/stock-in", json={"inventory_id": 3, "quantity": 40}, headers=admin)
    client.post(f"{API}/stock-transactions/stock-out", json={"inventory_id": 1, "quantity": 25}, headers=admin)
    client.put(f"{API}/assets/4", json={"status": "Disposed"}, headers=admin)
    client.put(f"{API}/assets/3", json={"status": "Under Maintenance"}, headers=admin)
    uid = get_id(client, admin, "users", "user_id", "username", "staff01")
    client.put(f"{API}/users/{uid}", json={"status": "Inactive"}, headers=admin)
    client.post(f"{API}/employees", json={"employee_code": "EMP-900", "employee_name": "New", "department_id": 1}, headers=admin)

    after = client.get(f"{API}/dashboard/stats", headers=admin).json()
    assert (after["stock_trend"][-1]["stock_in"], after["stock_trend"][-1]["stock_out"]) == (240, 85)
    assert after["active_users"] == 2 and after["total_users"] == 3
    assert after["total_employees"] == 6
    a = after["asset_summary"]
    assert (a["available_assets"], a["under_maintenance_assets"], a["other_assets"]) == (1, 1, 1)
    assert a["available_assets"] + a["assigned_assets"] + a["under_maintenance_assets"] + a["damaged_assets"] + a["other_assets"] == a["total_assets"]
    inv = after["inventory_summary"]
    assert (inv["low_stock_items"], inv["out_of_stock_items"]) == (1, 0)  # INV-003 went 0 -> 40 (min 20)
    assert after["recent_transactions"][0]["quantity"] == 25


def test_US_F1_stock_trend_buckets_by_month(client, admin):
    from datetime import datetime, timedelta
    from app.database import SessionLocal
    from app.models.stock_transaction import StockTransaction
    db = SessionLocal()
    try:
        db.add(StockTransaction(inventory_id=1, user_id=1, transaction_type="Stock In", quantity=7,
                                transaction_date=datetime.utcnow() - timedelta(days=62)))
        db.add(StockTransaction(inventory_id=1, user_id=1, transaction_type="Stock In", quantity=999,
                                transaction_date=datetime.utcnow() - timedelta(days=400)))  # outside window
        db.commit()
    finally:
        db.close()
    trend = client.get(f"{API}/dashboard/stats", headers=admin).json()["stock_trend"]
    assert sum(p["stock_in"] for p in trend) == 200 + 7
    assert [p["month"] for p in trend] == sorted(p["month"] for p in trend)


def test_US_F2_asset_history_report(client, manager):
    rows = client.get(f"{API}/reports/asset-history", headers=manager).json()
    assert len(rows) == 1
    row = rows[0]
    assert (row["asset_code"], row["employee_name"], row["department_name"], row["assigned_by"]) == ("LAP-001", "Sokha", "IT", "staff01")
    assert client.get(f"{API}/reports/asset-history", params={"start_date": "2026-09-01"}, headers=manager).json() == []
    assert len(client.get(f"{API}/reports/asset-history", params={"status_filter": "Assigned"}, headers=manager).json()) == 1


def test_US_F3_stock_movement_report(client, manager):
    rows = client.get(f"{API}/reports/stock-movements", headers=manager).json()
    assert len(rows) == 3
    assert {r["recorded_by"] for r in rows} == {"staff01"}
    ins = client.get(f"{API}/reports/stock-movements", params={"transaction_type": "Stock In"}, headers=manager).json()
    assert len(ins) == 1 and ins[0]["reference"] == "PO-2026-001"
    assert client.get(f"{API}/reports/stock-movements", params={"end_date": "2000-01-01"}, headers=manager).json() == []


def test_US_F4_department_summary_report(client, manager):
    rows = {r["department_name"]: r for r in client.get(f"{API}/reports/department-summary", headers=manager).json()}
    assert rows["IT"]["employee_count"] == 3
    assert rows["IT"]["assigned_assets_count"] == 1
    assert rows["IT"]["total_asset_value"] == 800.0
    assert rows["Finance"]["assigned_assets_count"] == 0


def test_US_F5_inventory_status_report(client, manager):
    rows = {r["item_code"]: r for r in client.get(f"{API}/reports/inventory-status", headers=manager).json()}
    assert rows["INV-002"]["needs_reorder"] is True
    assert rows["INV-003"]["needs_reorder"] is True
    assert rows["INV-001"]["needs_reorder"] is False
    assert rows["INV-001"]["supplier_name"] == "Global Supplies Co."


def test_US_F6_user_log_report(client, admin, staff):
    client.post(f"{API}/auth/logout", headers=staff)
    rows = client.get(f"{API}/reports/user-logs", headers=admin).json()
    assert {r["username"] for r in rows} >= {"admin", "staff01"}
    staff_row = next(r for r in rows if r["username"] == "staff01")
    assert staff_row["role_name"] == "Inventory Staff"
    logged_out = client.get(f"{API}/reports/user-logs", params={"status_filter": "Logged Out"}, headers=admin).json()
    assert [r["username"] for r in logged_out] == ["staff01"]


def test_US_F_reports_require_login(client):
    for path in ("asset-history", "stock-movements", "department-summary", "inventory-status", "user-logs"):
        assert client.get(f"{API}/reports/{path}").status_code == 401


# --------------------------------------------------------------- misc

def test_health_check(client):
    r = client.get("/")
    assert r.status_code == 200 and r.json()["status"] == "online"
