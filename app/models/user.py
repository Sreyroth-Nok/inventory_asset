from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(20), default="Active", nullable=False)
    phone = Column(String(20), nullable=True)
    gender = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    role = relationship("Role", back_populates="users")
    employee = relationship("Employee", back_populates="users")
    assignments_created = relationship("AssetAssignment", back_populates="assigner", foreign_keys="AssetAssignment.assigned_by")
    transactions = relationship("StockTransaction", back_populates="user")
    logs = relationship("UserLog", back_populates="user")


