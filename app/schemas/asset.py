from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from app.schemas.category import CategoryResponse
from app.schemas.supplier import SupplierResponse

class AssetBase(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    asset_code: str
    asset_name: str
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    condition: str = "Good" # Excellent, Good, Fair, Damaged
    status: str = "Available" # Available, Assigned, Under Maintenance, Damaged, Lost, Disposed
    description: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    asset_code: Optional[str] = None
    asset_name: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[Decimal] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

class AssignedEmployeeInfo(BaseModel):
    assignment_id: int
    employee_id: int
    employee_code: str
    employee_name: str
    assigned_date: Optional[date] = None
    condition_on_assignment: Optional[str] = None

class AssetResponse(AssetBase):
    asset_id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryResponse] = None
    supplier: Optional[SupplierResponse] = None
    assigned_to: Optional[AssignedEmployeeInfo] = None

    class Config:
        from_attributes = True

