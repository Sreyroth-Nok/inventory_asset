from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.schemas.department import DepartmentResponse

class EmployeeBase(BaseModel):
    department_id: int
    employee_code: str
    employee_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    status: str = "Active"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    employee_id: int
    created_at: datetime
    updated_at: datetime
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True
