from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.supplier import SupplierResponse

class InventoryItemBase(BaseModel):
    supplier_id: int
    item_code: str
    item_name: str
    category: Optional[str] = None
    unit: str = "Pack"
    quantity: int = 0
    minimum_stock: int = 10
    status: str = "Available" # Available, Low Stock, Out of Stock, Inactive
    description: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    supplier_id: Optional[int] = None
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[int] = None
    minimum_stock: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None

class InventoryItemResponse(InventoryItemBase):
    inventory_id: int
    created_at: datetime
    updated_at: datetime
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True
