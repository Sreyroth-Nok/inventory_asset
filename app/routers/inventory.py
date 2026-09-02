from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.inventory import InventoryItem
from app.models.supplier import Supplier
from app.schemas.inventory import InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/inventory", tags=["Inventory Items"])

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory_items(
    skip: int = 0,
    limit: int = 100,
    supplier_id: Optional[int] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(InventoryItem)
    if supplier_id:
        query = query.filter(InventoryItem.supplier_id == supplier_id)
    if category:
        query = query.filter(InventoryItem.category == category)
    if status_filter:
        query = query.filter(InventoryItem.status == status_filter)
    if search:
        query = query.filter(
            (InventoryItem.item_code.ilike(f"%{search}%")) |
            (InventoryItem.item_name.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    sup = db.query(Supplier).filter(Supplier.supplier_id == item_in.supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    if db.query(InventoryItem).filter(InventoryItem.item_code == item_in.item_code).first():
        raise HTTPException(status_code=400, detail=f"Item code {item_in.item_code} already exists")

    item = InventoryItem(**item_in.model_dump())
    item.update_status()
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/{inventory_id}", response_model=InventoryItemResponse)
def get_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.inventory_id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item

@router.put("/{inventory_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    inventory_id: int,
    item_in: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    item = db.query(InventoryItem).filter(InventoryItem.inventory_id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    
    update_data = item_in.model_dump(exclude_unset=True)
    if "supplier_id" in update_data:
        sup = db.query(Supplier).filter(Supplier.supplier_id == update_data["supplier_id"]).first()
        if not sup:
            raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in update_data.items():
        setattr(item, key, value)
        
    item.update_status()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    item = db.query(InventoryItem).filter(InventoryItem.inventory_id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return None
