from datetime import date, datetime
from typing import List
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
from app.schemas.dashboard import DashboardStatsResponse, AssetStats, InventoryStats, StockTrendPoint
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

TREND_MONTHS = 6


def _stock_trend(db: Session, months: int) -> List[StockTrendPoint]:
    """Units moved in / out per calendar month, oldest first, including empty months."""
    today = date.today()
    keys = []
    y, m = today.year, today.month
    for _ in range(months):
        keys.append((y, m))
        y, m = (y - 1, 12) if m == 1 else (y, m - 1)
    keys.reverse()

    start = datetime(keys[0][0], keys[0][1], 1)
    totals = {k: {"Stock In": 0, "Stock Out": 0} for k in keys}
    rows = db.query(StockTransaction).filter(StockTransaction.transaction_date >= start).all()
    for tx in rows:
        k = (tx.transaction_date.year, tx.transaction_date.month)
        if k in totals and tx.transaction_type in totals[k]:
            totals[k][tx.transaction_type] += tx.quantity

    return [
        StockTrendPoint(
            month=f"{y:04d}-{m:02d}",
            label=date(y, m, 1).strftime("%b %Y"),
            stock_in=totals[(y, m)]["Stock In"],
            stock_out=totals[(y, m)]["Stock Out"],
        )
        for (y, m) in keys
    ]

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.status == "Active").count()
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
        damaged_assets=damaged_assets,
        other_assets=total_assets - available_assets - assigned_assets - under_maintenance_assets - damaged_assets,
        overdue_assignments=db.query(AssetAssignment).filter(
            AssetAssignment.status == "Assigned",
            AssetAssignment.expected_return_date.isnot(None),
            AssetAssignment.expected_return_date < date.today(),
        ).count(),
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
        active_users=active_users,
        stock_trend=_stock_trend(db, months=TREND_MONTHS),
        total_employees=total_employees,
        total_departments=total_departments,
        total_suppliers=total_suppliers,
        asset_summary=asset_stats,
        inventory_summary=inventory_stats,
        recent_transactions=recent_transactions,
        recent_assignments=recent_assignments
    )
