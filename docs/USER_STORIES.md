# User Stories — Inventory & Asset Management System

**System:** F4-option Admin (FastAPI backend + React/MUI web admin)
**Version:** 2.0 · **Last updated:** 2026-11-06

---

## 1. Personas

| Persona | Role in system | Goal |
|---|---|---|
| **System Administrator** | `Admin` | Owns the system: manages user accounts, roles, master data, and can delete records. |
| **Warehouse Manager** | `Warehouse Manager` | Oversees stock and assets, suppliers and employees; reviews reports. |
| **Inventory Staff** | `Inventory Staff` | Does day-to-day work: hands out and takes back assets, records stock in/out. |

### Permission matrix (intended behaviour)

| Capability | Admin | Warehouse Manager | Inventory Staff |
|---|:-:|:-:|:-:|
| Log in / view own profile / log out | ✅ | ✅ | ✅ |
| View dashboard & reports, export reports | ✅ | ✅ | ✅ |
| Create / edit assets, categories, inventory items, suppliers, employees | ✅ | ✅ | ✅ |
| Assign / return assets, Stock In / Stock Out | ✅ | ✅ | ✅ |
| Create / edit departments | ✅ | ✅ | ❌ |
| Delete any record | ✅ | ❌ | ❌ |
| Manage user accounts and roles | ✅ | ❌ | ❌ |
| Web tabs visible | All | Dashboard, Assets, Inventory, Reports, Employees, Suppliers | Dashboard, Assets, Inventory, Reports |

---

## 2. Epics & Stories

Story IDs are referenced by the automated test suite in [`tests/test_user_stories.py`](../tests/test_user_stories.py).

### Epic A — Authentication & Session

**US-A1 · Log in**
*As a* system user, *I want to* log in with my username and password *so that* I can access the functions allowed for my role.
- Valid credentials return a JWT bearer token.
- Wrong username or password returns **401** "Incorrect username or password".
- An account whose status is not `Active` is refused with **403**.
- Every successful login writes a login record (user, time, status `Active`) to the user log.

**US-A2 · View my profile**
*As a* logged-in user, *I want to* see my profile and role *so that* the app shows the right menu for me.
- `GET /auth/me` returns my username, email, role name and linked employee.
- A missing or invalid token returns **401**.

**US-A3 · Log out**
*As a* logged-in user, *I want to* log out *so that* my session is closed and recorded.
- The latest active log record gets a logout time and status `Logged Out`.
- The web app asks for confirmation before signing out and returns to the login screen.

**US-A4 · Role-based access**
*As an* administrator, *I want* each role restricted to its permitted functions *so that* data is protected.
- Calls outside a role's permissions return **403** "Operation not permitted for role: …".
- The web sidebar shows only the tabs for the user's role; opening a forbidden tab shows "Access Restricted".

### Epic B — User & Role Administration (Admin only)

**US-B1 · Create user accounts** — *As an* Admin, *I want to* register a user with username, email, password, role and optional employee link *so that* staff can log in.
- Duplicate username or email → **400**. Unknown employee ID or role name → **404**.
- Phone and gender are saved and shown in the user list.
- Password is stored hashed (bcrypt), never in plain text.

**US-B2 · Edit user accounts** — *As an* Admin, *I want to* change a user's email, role, status or password *so that* access stays up to date.
- Changing the role takes effect on the user's next request.
- Leaving the password blank keeps the current password.
- Setting status to `Inactive` blocks that user's login and existing token.

**US-B3 · Delete user accounts** — *As an* Admin, *I want to* remove a user account that is no longer needed.
- An Admin cannot delete their own account.
- A user with login, assignment or stock history cannot be deleted (**400**, suggests setting `Inactive`) so the audit trail stays intact.

**US-B4 · Manage roles** — *As an* Admin, *I want to* create, rename, describe and delete roles.
- Duplicate role name → **400**.

### Epic C — Organisation Master Data

**US-C1 · Manage departments** — *As an* Admin or Warehouse Manager, *I want to* create, edit and list departments (IT, HR, Finance…). Only Admin may delete.

**US-C2 · Manage employees** — *As a* staff user, *I want to* register employees with a unique code, department, contact details and position *so that* assets can be assigned to them.
- Duplicate employee code → **400**; unknown department → **404**.
- Search by name or code; filter by department or status.
- An employee with assignment history cannot be deleted (**400**, suggests `Inactive`).

**US-C3 · Manage suppliers** — *As a* staff user, *I want to* keep a list of suppliers with contact person, phone, email and address; search by name or contact.

**US-C4 · Manage asset categories** — *As a* staff user, *I want to* maintain asset categories (Laptop, Printer…) used to classify assets.

### Epic D — Asset Management

**US-D1 · Register an asset** — *As a* staff user, *I want to* register a physical asset with a unique code, name, category, supplier, serial number, purchase date/price, condition and status.
- Duplicate asset code → **400**; unknown category or supplier → **404**.

**US-D2 · Find assets** — *As a* staff user, *I want to* search assets by code, name or serial number and filter by category, supplier, status or condition.
- An `Assigned` asset shows who holds it (employee code, name, assignment date).

**US-D3 · Edit / delete an asset** — *As a* staff user, *I want to* update asset details; only Admin may delete.
- An asset with assignment history cannot be deleted (**400**, suggests status `Disposed`).
- Status `Assigned` is only set by the assign action (**400** if set by create/edit).
- An assigned asset's status cannot be edited until it is returned (**400**); the web form locks the field.

**US-D4 · Assign an asset to an employee** — *As a* staff user, *I want to* hand an available asset to an employee *so that* we know who is responsible for it.
- Only assets with status `Available` can be assigned; otherwise **400** with the current status.
- Only `Active` employees can receive assets (**400** otherwise); the web form lists active employees only.
- The asset status changes to `Assigned`; the assignment records who assigned it, date and condition.
- The **assigned date** defaults to today and can be set to an earlier day, but not a future one (**400**).
- An **expected return date** is optional: empty = permanent handover (e.g. staff laptop); set = loan. It cannot be before the assigned date (**400**). Quick picks: 1 / 7 / 14 / 30 days.

**US-D5 · Return an asset** — *As a* staff user, *I want to* record an asset's return with its condition and resulting status (e.g. `Available`, `Damaged`, `Under Maintenance`).
- The assignment becomes `Returned` with return date; asset condition/status are updated.
- The **returned date** defaults to today; it cannot be before the assigned date or in the future (**400**).
- Returning an already-returned assignment → **400**.

**US-D6 · Assignment history page** — *As a* manager, *I want* a separate **Asset Assignments** page listing every handover *so that* I can see when each asset was assigned and when it came back.
- Columns: asset, employee (+ department), assigned date + who assigned it, expected return, returned date, days held, condition out/in, status.
- Filter by All / Active / Overdue / Returned, search by asset or employee, and by assigned-date range.
- New assignments and returns can be made from this page as well as from the Assets page.
- API: `GET /asset-assignments` with `status_filter` (`Assigned` | `Returned` | `Overdue`), `employee_id`, `asset_id`, `start_date`, `end_date`, `search`.

**US-D7 · Overdue loans** — *As a* manager, *I want* assets not returned by their expected return date flagged as **Overdue** *so that* I can follow up.
- Overdue = still `Assigned` and expected return date is before today. Shown on the Assignments page, the Assets page ("Overdue by N days"), the dashboard (count), and the Asset Handover report (status filter `Overdue`).
- The expected return date of an active assignment can be extended or cleared (`PUT /asset-assignments/{id}`); returned assignments cannot be changed (**400**).
- Late returns show how many days late they were.

### Epic E — Inventory & Stock Control

**US-E1 · Manage inventory items** — *As a* staff user, *I want to* register consumable items with code, name, category, unit, quantity, minimum stock and supplier.
- Status is calculated automatically: `Out of Stock` (qty ≤ 0), `Low Stock` (qty < minimum), otherwise `Available`; `Inactive` is kept as set.
- Duplicate item code → **400**.
- An item with stock transactions cannot be deleted (**400**, suggests `Inactive`).

**US-E2 · Stock In** — *As a* staff user, *I want to* record received stock with a reference (e.g. PO number) and reason *so that* quantity increases and is audited.
- Quantity must be > 0 (**422** otherwise). Status recalculates.

**US-E3 · Stock Out** — *As a* staff user, *I want to* record issued stock *so that* quantity decreases and is audited.
- Requesting more than is on hand → **400** "Insufficient stock…"; quantity is unchanged.

**US-E4 · Transaction history** — *As a* manager, *I want to* see the history of stock movements filtered by item or type.

### Epic F — Dashboard & Reports

**US-F1 · Dashboard** — *As a* user, *I want* a dashboard with totals (users, employees, departments, suppliers), asset counts by status, inventory counts by status, and the 5 most recent transactions and assignments.
- Every figure and chart comes from the database; nothing is hard-coded.
- Shows active vs total user accounts, a Stock In vs Stock Out chart (units per month, last 6 months, with a table view) and an asset-status breakdown.
- Shows whether the backend is reachable and when the data was last refreshed.

**US-F2 · Asset handover history report** — filter by date range, asset, employee and status; shows department and who assigned it.

**US-F3 · Stock movement report** — filter by date range, type and item.

**US-F4 · Department summary report** — per department: employee count, assigned assets and their total purchase value.

**US-F5 · Inventory status report** — every item with quantity, minimum, supplier, and a "needs reorder" flag.

**US-F6 · User access audit log** — login/logout times and session duration per user (filter by date, username, status).

**US-F7 · Export reports** — *As a* manager, *I want to* export any report to Excel (CSV) or print/save as PDF.

---

## 3. Non-functional stories

- **US-N1** Passwords are hashed with bcrypt; JWT tokens expire after 24 h.
- **US-N2** The API falls back to SQLite when PostgreSQL is unreachable, so the system runs with no setup.
- **US-N3** The web admin builds without TypeScript errors and supports light/dark theme.
