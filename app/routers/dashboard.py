from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.employee import Employee
from app.models.department import Department
from app.models.supplier import Supplier
from app.models.asset import Asset
from app.models.asset_assignment import AssetAssignment
from app.models.inventory import InventoryItem
from app.models.stock_transaction import StockTransaction
from app.schemas.dashboard import DashboardStatsResponse, AssetStats, InventoryStats
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_users = db.query(User).count()
    total_employees = db.query(Employee).count()
    total_departments = db.query(Department).count()
    total_suppliers = db.query(Supplier).count()

    # Asset Stats
    total_assets = db.query(Asset).count()
    available_assets = db.query(Asset).filter(Asset.status == "Available").count()
    assigned_assets = db.query(Asset).filter(Asset.status == "Assigned").count()
    under_maintenance_assets = db.query(Asset).filter(Asset.status == "Under Maintenance").count()
    damaged_assets = db.query(Asset).filter(Asset.status == "Damaged").count()

    asset_stats = AssetStats(
        total_assets=total_assets,
        available_assets=available_assets,
        assigned_assets=assigned_assets,
        under_maintenance_assets=under_maintenance_assets,
        damaged_assets=damaged_assets
    )

    # Inventory Stats
    total_items = db.query(InventoryItem).count()
    available_items = db.query(InventoryItem).filter(InventoryItem.status == "Available").count()
    low_stock_items = db.query(InventoryItem).filter(InventoryItem.status == "Low Stock").count()
    out_of_stock_items = db.query(InventoryItem).filter(InventoryItem.status == "Out of Stock").count()

    inventory_stats = InventoryStats(
        total_items=total_items,
        available_items=available_items,
        low_stock_items=low_stock_items,
        out_of_stock_items=out_of_stock_items
    )

    # Recent transactions (top 5)
    recent_transactions = (
        db.query(StockTransaction)
        .order_by(StockTransaction.transaction_date.desc())
        .limit(5)
        .all()
    )

    # Recent assignments (top 5)
    recent_assignments = (
        db.query(AssetAssignment)
        .order_by(AssetAssignment.created_at.desc())
        .limit(5)
        .all()
    )

    return DashboardStatsResponse(
        total_users=total_users,
        total_employees=total_employees,
        total_departments=total_departments,
        total_suppliers=total_suppliers,
        asset_summary=asset_stats,
        inventory_summary=inventory_stats,
        recent_transactions=recent_transactions,
        recent_assignments=recent_assignments
    )
