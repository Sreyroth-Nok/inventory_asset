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

    class Config:
        from_attributes = True

class InventoryStats(BaseModel):
    total_items: int
    available_items: int
    low_stock_items: int
    out_of_stock_items: int

    class Config:
        from_attributes = True

class DashboardStatsResponse(BaseModel):
    total_users: int
    total_employees: int
    total_departments: int
    total_suppliers: int
    asset_summary: AssetStats
    inventory_summary: InventoryStats
    recent_transactions: List[StockTransactionResponse]
    recent_assignments: List[AssetAssignmentResponse]

    class Config:
        from_attributes = True
