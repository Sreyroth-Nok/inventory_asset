from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DepartmentBase(BaseModel):
    department_name: str
    description: Optional[str] = None
    status: str = "Active"

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    department_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    department_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
