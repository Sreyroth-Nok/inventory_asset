from app.schemas.auth import Token, TokenData, LoginRequest
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.schemas.asset_assignment import AssetAssignCreate, AssetReturnRequest, AssetAssignmentResponse
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from app.schemas.stock_transaction import StockInRequest, StockOutRequest, StockTransactionResponse
from app.schemas.dashboard import DashboardStatsResponse

__all__ = [
    "Token",
    "TokenData",
    "LoginRequest",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "SupplierCreate",
    "SupplierUpdate",
    "SupplierResponse",
    "AssetCreate",
    "AssetUpdate",
    "AssetResponse",
    "AssetAssignCreate",
    "AssetReturnRequest",
    "AssetAssignmentResponse",
    "InventoryItemCreate",
    "InventoryItemUpdate",
    "InventoryItemResponse",
    "StockInRequest",
    "StockOutRequest",
    "StockTransactionResponse",
    "DashboardStatsResponse"
]
