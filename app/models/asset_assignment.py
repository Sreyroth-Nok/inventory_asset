from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("assets.asset_id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    assigned_date = Column(Date, nullable=False, default=datetime.utcnow().date)
    condition_on_assignment = Column(String(30), nullable=True)
    returned_date = Column(Date, nullable=True)
    condition_on_return = Column(String(30), nullable=True)
    status = Column(String(30), default="Assigned", nullable=False) # Assigned, Returned
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")
    assigner = relationship("User", back_populates="assignments_created", foreign_keys=[assigned_by])
