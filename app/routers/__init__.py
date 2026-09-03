from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.roles import router as roles_router
from app.routers.departments import router as departments_router
from app.routers.employees import router as employees_router
from app.routers.categories import router as categories_router
from app.routers.suppliers import router as suppliers_router
from app.routers.assets import router as assets_router
from app.routers.asset_assignments import router as asset_assignments_router
from app.routers.inventory import router as inventory_router
from app.routers.stock_transactions import router as stock_transactions_router
from app.routers.dashboard import router as dashboard_router
from app.routers.reports import router as reports_router

__all__ = [
    "auth_router",
    "users_router",
    "roles_router",
    "departments_router",
    "employees_router",
    "categories_router",
    "suppliers_router",
    "assets_router",
    "asset_assignments_router",
    "inventory_router",
    "stock_transactions_router",
    "dashboard_router",
    "reports_router"
]


