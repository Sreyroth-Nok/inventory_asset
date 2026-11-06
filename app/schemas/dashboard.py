from pydantic import BaseModel
from typing import List, Optional
from app.schemas.stock_transaction import StockTransactionResponse
from app.schemas.asset_assignment import AssetAssignmentResponse

class AssetStats(BaseModel):
    total_assets: int
    available_assets: int
    assigned_assets: int
    under_maintenance_assets: int
    damaged_assets: int
    other_assets: int = 0  # Lost, Disposed, Retired, ...
    overdue_assignments: int = 0  # still out after expected return date

    class Config:
        from_attributes = True

class InventoryStats(BaseModel):
    total_items: int
    available_items: int
    low_stock_items: int
    out_of_stock_items: int

    class Config:
        from_attributes = True

class StockTrendPoint(BaseModel):
    month: str          # "2026-11"
    label: str          # "Nov 2026"
    stock_in: int       # total units received that month
    stock_out: int      # total units issued that month


class DashboardStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_employees: int
    total_departments: int
    total_suppliers: int
    asset_summary: AssetStats
    inventory_summary: InventoryStats
    recent_transactions: List[StockTransactionResponse]
    recent_assignments: List[AssetAssignmentResponse]
    stock_trend: List[StockTrendPoint]

    class Config:
        from_attributes = True
