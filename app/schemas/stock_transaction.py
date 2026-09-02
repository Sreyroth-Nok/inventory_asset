from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.schemas.inventory import InventoryItemResponse
from app.schemas.user import UserResponse

class StockInRequest(BaseModel):
    inventory_id: int
    quantity: int = Field(..., gt=0, description="Quantity to add (must be > 0)")
    reference: Optional[str] = None
    reason: Optional[str] = None
    remarks: Optional[str] = None

class StockOutRequest(BaseModel):
    inventory_id: int
    quantity: int = Field(..., gt=0, description="Quantity to issue/remove (must be > 0)")
    reference: Optional[str] = None
    reason: Optional[str] = None
    remarks: Optional[str] = None

class StockTransactionResponse(BaseModel):
    transaction_id: int
    inventory_id: int
    user_id: int
    transaction_type: str # Stock In, Stock Out
    quantity: int
    transaction_date: datetime
    reference: Optional[str] = None
    reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: datetime
    inventory_item: Optional[InventoryItemResponse] = None
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True
