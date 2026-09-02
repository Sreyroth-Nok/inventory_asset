from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class StockTransaction(Base):
    __tablename__ = "stock_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    inventory_id = Column(Integer, ForeignKey("inventory_items.inventory_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    transaction_type = Column(String(20), nullable=False) # Stock In, Stock Out
    quantity = Column(Integer, nullable=False)
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    reference = Column(String(100), nullable=True)
    reason = Column(String(255), nullable=True)
    remarks = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    inventory_item = relationship("InventoryItem", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
