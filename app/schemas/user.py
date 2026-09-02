from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from app.schemas.employee import EmployeeResponse

class UserBase(BaseModel):
    employee_id: Optional[int] = None
    username: str
    email: str
    role: Optional[str] = "Inventory Staff"
    status: str = "Active"

    @field_validator("role", mode="before")
    @classmethod
    def serialize_role(cls, v):
        if hasattr(v, "role_name"):
            return v.role_name
        if isinstance(v, str):
            return v
        return "Inventory Staff"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    employee_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True
