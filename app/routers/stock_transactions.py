from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.inventory import InventoryItem
from app.models.stock_transaction import StockTransaction
from app.schemas.stock_transaction import StockInRequest, StockOutRequest, StockTransactionResponse
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/stock-transactions", tags=["Stock Transactions"])

@router.get("", response_model=List[StockTransactionResponse])
def get_transactions(
    skip: int = 0,
    limit: int = 100,
    inventory_id: Optional[int] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(StockTransaction)
    if inventory_id:
        query = query.filter(StockTransaction.inventory_id == inventory_id)
    if transaction_type:
        query = query.filter(StockTransaction.transaction_type == transaction_type)
    return query.order_by(StockTransaction.transaction_date.desc()).offset(skip).limit(limit).all()

@router.post("/stock-in", response_model=StockTransactionResponse, status_code=status.HTTP_201_CREATED)
def perform_stock_in(
    payload: StockInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    """Add stock to inventory item and automatically update quantity & status"""
    item = db.query(InventoryItem).filter(InventoryItem.inventory_id == payload.inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    transaction = StockTransaction(
        inventory_id=payload.inventory_id,
        user_id=current_user.user_id,
        transaction_type="Stock In",
        quantity=payload.quantity,
        transaction_date=datetime.utcnow(),
        reference=payload.reference,
        reason=payload.reason,
        remarks=payload.remarks
    )
    
    # Increase quantity and recalculate status
    item.quantity += payload.quantity
    item.update_status()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.post("/stock-out", response_model=StockTransactionResponse, status_code=status.HTTP_201_CREATED)
def perform_stock_out(
    payload: StockOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    """Remove/issue stock from inventory item with insufficient stock validation"""
    item = db.query(InventoryItem).filter(InventoryItem.inventory_id == payload.inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
        
    if item.quantity < payload.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for '{item.item_name}'. Current quantity: {item.quantity}, Requested: {payload.quantity}"
        )
        
    transaction = StockTransaction(
        inventory_id=payload.inventory_id,
        user_id=current_user.user_id,
        transaction_type="Stock Out",
        quantity=payload.quantity,
        transaction_date=datetime.utcnow(),
        reference=payload.reference,
        reason=payload.reason,
        remarks=payload.remarks
    )
    
    # Decrease quantity and recalculate status
    item.quantity -= payload.quantity
    item.update_status()
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction
