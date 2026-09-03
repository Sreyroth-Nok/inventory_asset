from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.asset import Asset
from app.models.category import AssetCategory
from app.models.supplier import Supplier
from app.models.asset_assignment import AssetAssignment
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse, AssignedEmployeeInfo
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=List[AssetResponse])
def get_assets(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    condition_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Asset)
    if category_id:
        query = query.filter(Asset.category_id == category_id)
    if supplier_id:
        query = query.filter(Asset.supplier_id == supplier_id)
    if status_filter:
        query = query.filter(Asset.status == status_filter)
    if condition_filter:
        query = query.filter(Asset.condition == condition_filter)
    if search:
        query = query.filter(
            (Asset.asset_code.ilike(f"%{search}%")) |
            (Asset.asset_name.ilike(f"%{search}%")) |
            (Asset.serial_number.ilike(f"%{search}%"))
        )
    assets = query.offset(skip).limit(limit).all()
    
    # Populate active assigned employee information if asset status is Assigned
    for asset in assets:
        if asset.status == "Assigned":
            active_assign = db.query(AssetAssignment).filter(
                AssetAssignment.asset_id == asset.asset_id,
                AssetAssignment.status == "Assigned"
            ).first()
            if active_assign and active_assign.employee:
                asset.assigned_to = AssignedEmployeeInfo(
                    assignment_id=active_assign.assignment_id,
                    employee_id=active_assign.employee_id,
                    employee_code=active_assign.employee.employee_code,
                    employee_name=active_assign.employee.employee_name,
                    assigned_date=active_assign.assigned_date,
                    condition_on_assignment=active_assign.condition_on_assignment
                )
    return assets


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(
    asset_in: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    # Verify Category exists
    cat = db.query(AssetCategory).filter(AssetCategory.category_id == asset_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail=f"Category ID {asset_in.category_id} not found")
        
    # Verify Supplier exists
    sup = db.query(Supplier).filter(Supplier.supplier_id == asset_in.supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail=f"Supplier ID {asset_in.supplier_id} not found")
        
    # Check asset_code uniqueness
    if db.query(Asset).filter(Asset.asset_code == asset_in.asset_code).first():
        raise HTTPException(status_code=400, detail=f"Asset code {asset_in.asset_code} already exists")

    asset = Asset(**asset_in.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.status == "Assigned":
        active_assign = db.query(AssetAssignment).filter(
            AssetAssignment.asset_id == asset.asset_id,
            AssetAssignment.status == "Assigned"
        ).first()
        if active_assign and active_assign.employee:
            asset.assigned_to = AssignedEmployeeInfo(
                assignment_id=active_assign.assignment_id,
                employee_id=active_assign.employee_id,
                employee_code=active_assign.employee.employee_code,
                employee_name=active_assign.employee.employee_name,
                assigned_date=active_assign.assigned_date,
                condition_on_assignment=active_assign.condition_on_assignment
            )
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_in: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_in.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        if not db.query(AssetCategory).filter(AssetCategory.category_id == update_data["category_id"]).first():
            raise HTTPException(status_code=404, detail="Category not found")
            
    if "supplier_id" in update_data:
        if not db.query(Supplier).filter(Supplier.supplier_id == update_data["supplier_id"]).first():
            raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in update_data.items():
        setattr(asset, key, value)
        
    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return None
