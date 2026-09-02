from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models.asset import Asset
from app.models.employee import Employee
from app.models.asset_assignment import AssetAssignment
from app.schemas.asset_assignment import AssetAssignCreate, AssetReturnRequest, AssetAssignmentResponse
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/asset-assignments", tags=["Asset Assignments"])

@router.get("", response_model=List[AssetAssignmentResponse])
def get_assignments(
    skip: int = 0,
    limit: int = 100,
    asset_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AssetAssignment)
    if asset_id:
        query = query.filter(AssetAssignment.asset_id == asset_id)
    if employee_id:
        query = query.filter(AssetAssignment.employee_id == employee_id)
    if status_filter:
        query = query.filter(AssetAssignment.status == status_filter)
    return query.order_by(AssetAssignment.created_at.desc()).offset(skip).limit(limit).all()

@router.post("/assign", response_model=AssetAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_asset(
    assign_in: AssetAssignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    """Assign an available physical asset to an employee"""
    asset = db.query(Asset).filter(Asset.asset_id == assign_in.asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if asset.status != "Available":
        raise HTTPException(
            status_code=400,
            detail=f"Asset '{asset.asset_name}' ({asset.asset_code}) cannot be assigned because its status is currently '{asset.status}'"
        )
        
    emp = db.query(Employee).filter(Employee.employee_id == assign_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    assign_date = assign_in.assigned_date if assign_in.assigned_date else date.today()
    
    assignment = AssetAssignment(
        asset_id=assign_in.asset_id,
        employee_id=assign_in.employee_id,
        assigned_by=current_user.user_id,
        assigned_date=assign_date,
        condition_on_assignment=assign_in.condition_on_assignment or asset.condition,
        status="Assigned",
        remarks=assign_in.remarks
    )
    
    # Update asset status to Assigned
    asset.status = "Assigned"
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.post("/{assignment_id}/return", response_model=AssetAssignmentResponse)
def return_asset(
    assignment_id: int,
    return_in: AssetReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    """Return an assigned asset back to inventory"""
    assignment = db.query(AssetAssignment).filter(AssetAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment record not found")
        
    if assignment.status == "Returned":
        raise HTTPException(status_code=400, detail="This assignment record is already marked as Returned")
        
    asset = db.query(Asset).filter(Asset.asset_id == assignment.asset_id).first()
    
    ret_date = return_in.returned_date if return_in.returned_date else date.today()
    
    assignment.returned_date = ret_date
    assignment.condition_on_return = return_in.condition_on_return
    assignment.status = "Returned"
    if return_in.remarks:
        assignment.remarks = f"{assignment.remarks or ''} | Return remark: {return_in.remarks}"
        
    if asset:
        asset.condition = return_in.condition_on_return
        asset.status = return_in.status_on_return or "Available"
        
    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/active", response_model=List[AssetAssignmentResponse])
def get_active_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all currently active (unreturned) asset assignments"""
    return db.query(AssetAssignment).filter(AssetAssignment.status == "Assigned").all()
