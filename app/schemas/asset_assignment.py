from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.schemas.asset import AssetResponse
from app.schemas.employee import EmployeeResponse
from app.schemas.user import UserResponse

class AssetAssignCreate(BaseModel):
    asset_id: int
    employee_id: int
    assigned_date: Optional[date] = None          # defaults to today
    expected_return_date: Optional[date] = None   # optional due-back date (loans)
    condition_on_assignment: Optional[str] = "Good"
    remarks: Optional[str] = None

class AssetReturnRequest(BaseModel):
    returned_date: Optional[date] = None          # defaults to today
    condition_on_return: Optional[str] = "Good"
    status_on_return: Optional[str] = "Available" # Update asset status, e.g. Available or Damaged
    remarks: Optional[str] = None

class AssetAssignmentUpdate(BaseModel):
    """Change the due date (extend / clear) or notes of an active assignment."""
    expected_return_date: Optional[date] = None
    remarks: Optional[str] = None

class AssetAssignmentResponse(BaseModel):
    assignment_id: int
    asset_id: int
    employee_id: int
    assigned_by: int
    assigned_date: date
    expected_return_date: Optional[date] = None
    condition_on_assignment: Optional[str] = None
    returned_date: Optional[date] = None
    condition_on_return: Optional[str] = None
    status: str
    is_overdue: bool = False
    remarks: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    asset: Optional[AssetResponse] = None
    employee: Optional[EmployeeResponse] = None
    assigner: Optional[UserResponse] = None

    class Config:
        from_attributes = True
