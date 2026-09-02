from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    inventory_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.supplier_id"), nullable=False)
    item_code = Column(String(50), unique=True, index=True, nullable=False)
    item_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    unit = Column(String(30), nullable=False, default="Pack")
    quantity = Column(Integer, default=0, nullable=False)
    minimum_stock = Column(Integer, default=10, nullable=False)
    status = Column(String(30), default="Available", nullable=False) # Available, Low Stock, Out of Stock, Inactive
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    supplier = relationship("Supplier", back_populates="inventory_items")
    transactions = relationship("StockTransaction", back_populates="inventory_item")

    def update_status(self):
        """Helper method to calculate inventory status automatically based on quantity vs minimum_stock"""
        if self.status == "Inactive":
            return
        if self.quantity <= 0:
            self.status = "Out of Stock"
        elif self.quantity < self.minimum_stock:
            self.status = "Low Stock"
        else:
            self.status = "Available"
