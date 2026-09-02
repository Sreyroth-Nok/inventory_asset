# Inventory & Asset Management System - Backend API (Python / FastAPI)

A modern, robust, and clean RESTful API for managing organizational assets and bulk inventory items, built with **Python**, **FastAPI**, **SQLAlchemy 2.0**, and **PostgreSQL**.

---

## 🗄️ Database Architecture (9 Tables)

The system consists of 9 normalized database tables:

1. **`users`**: System users authorized for login (`Admin`, `Inventory Staff`, `Manager`) with hashed passwords and JWT auth.
2. **`departments`**: Organizational departments (`IT`, `HR`, `Finance`, `Marketing`, `Administration`).
3. **`employees`**: Employees working in departments who can receive physical assets.
4. **`asset_categories`**: Classification for physical assets (`Laptop`, `Desktop`, `Printer`, `Monitor`, `Projector`).
5. **`suppliers`**: Vendors supplying assets and inventory items.
6. **`assets`**: Physical tracked items with unique codes, serial numbers, conditions, and statuses (`Available`, `Assigned`, `Under Maintenance`, `Damaged`, `Lost`, `Disposed`).
7. **`asset_assignments`**: Connects assets and employees to track handout date, return date, and condition.
8. **`inventory_items`**: Bulk items tracked by quantity and minimum stock levels with automatic status logic (`Available`, `Low Stock`, `Out of Stock`, `Inactive`).
9. **`stock_transactions`**: Audit trail of every `Stock In` and `Stock Out` inventory movement.

---

## 🚀 Quick Start Guide

### 1. Installation & Environment Setup

```bash
# Navigate to project directory
cd d:/Beltie-IU/Y4S2/SPM2/project

# Install required Python dependencies
pip install -r requirements.txt
```

### 2. Database Configuration (`.env`)

Configure your PostgreSQL database connection string in `.env`:

```env
PROJECT_NAME="Inventory & Asset Management API"
API_V1_STR="/api"
SECRET_KEY="inventory_super_secret_jwt_key_2026"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory_db"
```

*(Note: If PostgreSQL is not currently running locally, the application automatically falls back to an embedded SQLite database for zero-config testing).*

### 3. Seed Sample Database

Run the database seed script to auto-create tables and populate initial mock data:

```bash
python seed.py
```

### 4. Run the API Server

```bash
python -m uvicorn app.main:app --reload --port 8000
```

- **Interactive API Documentation (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔐 Default Seed Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `123456` |
| Inventory Staff | `staff01` | `123456` |
| Manager | `manager01` | `123456` |

---

## 📡 API Endpoints Summary

### Authentication
- `POST /api/auth/login`: OAuth2 password form login (returns Bearer JWT Token)
- `POST /api/auth/login/json`: JSON payload login
- `GET /api/auth/me`: Get current user profile

### Dashboard Analytics
- `GET /api/dashboard/stats`: Aggregated summary statistics (total assets, assigned vs available, low stock alerts, recent transactions, active assignments)

### Departments & Employees
- `GET /api/departments` | `POST /api/departments` | `GET /api/departments/{id}` | `PUT /api/departments/{id}` | `DELETE /api/departments/{id}`
- `GET /api/employees` | `POST /api/employees` | `GET /api/employees/{id}` | `PUT /api/employees/{id}` | `DELETE /api/employees/{id}`

### Categories & Suppliers
- `GET /api/categories` | `POST /api/categories` | `GET /api/categories/{id}` | `PUT /api/categories/{id}` | `DELETE /api/categories/{id}`
- `GET /api/suppliers` | `POST /api/suppliers` | `GET /api/suppliers/{id}` | `PUT /api/suppliers/{id}` | `DELETE /api/suppliers/{id}`

### Asset Management & Assignments
- `GET /api/assets` | `POST /api/assets` | `GET /api/assets/{id}` | `PUT /api/assets/{id}` | `DELETE /api/assets/{id}`
- `POST /api/asset-assignments/assign`: Assign available asset to employee (auto-updates asset status to `Assigned`)
- `POST /api/asset-assignments/{id}/return`: Return assigned asset (auto-updates asset status back to `Available`)
- `GET /api/asset-assignments/active`: Retrieve active asset assignments

### Inventory & Stock Movements
- `GET /api/inventory` | `POST /api/inventory` | `GET /api/inventory/{id}` | `PUT /api/inventory/{id}` | `DELETE /api/inventory/{id}`
- `POST /api/stock-transactions/stock-in`: Record Stock In transaction (increases stock quantity & updates status)
- `POST /api/stock-transactions/stock-out`: Record Stock Out transaction (validates stock availability, decreases stock quantity & updates status)
- `GET /api/stock-transactions`: Retrieve transaction history

---

## 🛠 Tech Stack

- **Framework**: FastAPI 0.110+
- **Database Driver**: `psycopg2-binary`, `asyncpg` (PostgreSQL) / SQLAlchemy 2.0 ORM
- **Security**: Passlib (`bcrypt`), PyJWT (`python-jose`)
- **Validation**: Pydantic v2
