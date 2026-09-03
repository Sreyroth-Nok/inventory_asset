from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_id = Column(Integer, ForeignKey("asset_categories.category_id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=True)
    asset_code = Column(String(50), unique=True, index=True, nullable=False)
    asset_name = Column(String(100), nullable=False)
    serial_number = Column(String(100), nullable=True)
    purchase_date = Column(Date, nullable=True)
    purchase_price = Column(Numeric(10, 2), nullable=True)
    condition = Column(String(30), default="Good", nullable=False) # Excellent, Good, Fair, Damaged
    status = Column(String(30), default="Available", nullable=False) # Available, Assigned, Under Maintenance, Damaged, Lost, Disposed
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category = relationship("AssetCategory", back_populates="assets")
    supplier = relationship("Supplier", back_populates="assets")
    assignments = relationship("AssetAssignment", back_populates="asset")
