from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.asset import Asset
from app.models.employee import Employee
from app.models.asset_assignment import AssetAssignment
from app.schemas.asset_assignment import (
    AssetAssignCreate, AssetReturnRequest, AssetAssignmentUpdate, AssetAssignmentResponse
)
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/asset-assignments", tags=["Asset Assignments"])

STAFF_ROLES = ["Admin", "Warehouse Manager", "Inventory Staff"]


def _overdue_clause():
    return (
        (AssetAssignment.status == "Assigned")
        & (AssetAssignment.expected_return_date.isnot(None))
        & (AssetAssignment.expected_return_date < date.today())
    )


@router.get("", response_model=List[AssetAssignmentResponse])
def get_assignments(
    skip: int = 0,
    limit: int = 500,
    asset_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,   # Assigned | Returned | Overdue
    start_date: Optional[date] = None,     # assigned on/after
    end_date: Optional[date] = None,       # assigned on/before
    search: Optional[str] = None,          # asset code/name, employee code/name
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Full assignment history: who received which asset, when, when it is due and when it came back."""
    query = db.query(AssetAssignment)
    if asset_id:
        query = query.filter(AssetAssignment.asset_id == asset_id)
    if employee_id:
        query = query.filter(AssetAssignment.employee_id == employee_id)
    if status_filter == "Overdue":
        query = query.filter(_overdue_clause())
    elif status_filter:
        query = query.filter(AssetAssignment.status == status_filter)
    if start_date:
        query = query.filter(AssetAssignment.assigned_date >= start_date)
    if end_date:
        query = query.filter(AssetAssignment.assigned_date <= end_date)
    if search:
        like = f"%{search}%"
        query = (
            query.join(Asset, AssetAssignment.asset_id == Asset.asset_id)
            .join(Employee, AssetAssignment.employee_id == Employee.employee_id)
            .filter(or_(
                Asset.asset_code.ilike(like), Asset.asset_name.ilike(like),
                Employee.employee_code.ilike(like), Employee.employee_name.ilike(like),
            ))
        )
    return (
        query.order_by(AssetAssignment.assigned_date.desc(), AssetAssignment.assignment_id.desc())
        .offset(skip).limit(limit).all()
    )


@router.post("/assign", response_model=AssetAssignmentResponse, status_code=status.HTTP_201_CREATED)
def assign_asset(
    assign_in: AssetAssignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(STAFF_ROLES))
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
    if emp.status != "Active":
        raise HTTPException(
            status_code=400,
            detail=f"Employee {emp.employee_name} ({emp.employee_code}) is '{emp.status}' and cannot receive assets"
        )

    today = date.today()
    assign_date = assign_in.assigned_date or today
    if assign_date > today:
        raise HTTPException(status_code=400, detail="Assigned date cannot be in the future")
    if assign_in.expected_return_date and assign_in.expected_return_date < assign_date:
        raise HTTPException(status_code=400, detail="Expected return date cannot be before the assigned date")

    assignment = AssetAssignment(
        asset_id=assign_in.asset_id,
        employee_id=assign_in.employee_id,
        assigned_by=current_user.user_id,
        assigned_date=assign_date,
        expected_return_date=assign_in.expected_return_date,
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
    current_user: User = Depends(require_roles(STAFF_ROLES))
):
    """Return an assigned asset back to inventory"""
    assignment = db.query(AssetAssignment).filter(AssetAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment record not found")

    if assignment.status == "Returned":
        raise HTTPException(status_code=400, detail="This assignment record is already marked as Returned")

    ret_date = return_in.returned_date or date.today()
    if ret_date > date.today():
        raise HTTPException(status_code=400, detail="Returned date cannot be in the future")
    if ret_date < assignment.assigned_date:
        raise HTTPException(
            status_code=400,
            detail=f"Returned date cannot be before the assigned date ({assignment.assigned_date})"
        )

    asset = db.query(Asset).filter(Asset.asset_id == assignment.asset_id).first()

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


@router.put("/{assignment_id}", response_model=AssetAssignmentResponse)
def update_assignment(
    assignment_id: int,
    update_in: AssetAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(STAFF_ROLES))
):
    """Extend / clear the expected return date or edit notes of an active assignment."""
    assignment = db.query(AssetAssignment).filter(AssetAssignment.assignment_id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment record not found")
    if assignment.status != "Assigned":
        raise HTTPException(status_code=400, detail="Only active assignments can be changed")

    data = update_in.model_dump(exclude_unset=True)
    new_due = data.get("expected_return_date")
    if new_due and new_due < assignment.assigned_date:
        raise HTTPException(status_code=400, detail="Expected return date cannot be before the assigned date")
    for key, value in data.items():
        setattr(assignment, key, value)

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
