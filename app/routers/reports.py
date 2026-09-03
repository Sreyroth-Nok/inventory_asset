from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models.asset import Asset
from app.models.asset_assignment import AssetAssignment
from app.models.employee import Employee
from app.models.department import Department
from app.models.inventory import InventoryItem
from app.models.stock_transaction import StockTransaction
from app.models.user import User
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/asset-history")
def get_asset_history_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    asset_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve filterable report of all asset handover and lifecycle records"""
    query = db.query(AssetAssignment)
    
    if start_date:
        query = query.filter(AssetAssignment.assigned_date >= start_date)
    if end_date:
        query = query.filter(AssetAssignment.assigned_date <= end_date)
    if asset_id:
        query = query.filter(AssetAssignment.asset_id == asset_id)
    if employee_id:
        query = query.filter(AssetAssignment.employee_id == employee_id)
    if status_filter:
        query = query.filter(AssetAssignment.status == status_filter)

    assignments = query.order_by(AssetAssignment.created_at.desc()).all()
    
    result = []
    for assign in assignments:
        result.append({
            "assignment_id": assign.assignment_id,
            "asset_code": assign.asset.asset_code if assign.asset else "-",
            "asset_name": assign.asset.asset_name if assign.asset else "-",
            "employee_code": assign.employee.employee_code if assign.employee else "-",
            "employee_name": assign.employee.employee_name if assign.employee else "-",
            "department_name": assign.employee.department.department_name if assign.employee and assign.employee.department else "-",
            "assigned_by": assign.assigner.username if assign.assigner else "System",
            "assigned_date": str(assign.assigned_date) if assign.assigned_date else "-",
            "condition_on_assignment": assign.condition_on_assignment or "Good",
            "returned_date": str(assign.returned_date) if assign.returned_date else "-",
            "condition_on_return": assign.condition_on_return or "-",
            "status": assign.status,
            "remarks": assign.remarks or ""
        })
    return result


@router.get("/stock-movements")
def get_stock_movements_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    transaction_type: Optional[str] = None,
    inventory_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve audit log report of all stock movement transactions"""
    query = db.query(StockTransaction)
    
    if start_date:
        query = query.filter(func.date(StockTransaction.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(StockTransaction.created_at) <= end_date)
    if transaction_type:
        query = query.filter(StockTransaction.transaction_type == transaction_type)
    if inventory_id:
        query = query.filter(StockTransaction.inventory_id == inventory_id)
        
    transactions = query.order_by(StockTransaction.created_at.desc()).all()
    
    result = []
    for tx in transactions:
        result.append({
            "transaction_id": tx.transaction_id,
            "item_code": tx.inventory_item.item_code if tx.inventory_item else "-",
            "item_name": tx.inventory_item.item_name if tx.inventory_item else "-",
            "unit": tx.inventory_item.unit if tx.inventory_item else "-",
            "transaction_type": tx.transaction_type,
            "quantity": tx.quantity,
            "reference": tx.reference or "-",
            "reason": tx.reason or "-",
            "recorded_by": tx.user.username if tx.user else "System",
            "remarks": tx.remarks or "-",
            "created_at": tx.created_at.strftime("%Y-%m-%d %H:%M") if tx.created_at else "-"
        })
    return result


@router.get("/department-summary")
def get_department_summary_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve report breakdown of assets and monetary values per department"""
    departments = db.query(Department).all()
    result = []
    
    for dept in departments:
        emp_count = db.query(Employee).filter(Employee.department_id == dept.department_id).count()
        
        # Get count of active assigned assets to employees in this department
        assigned_assets_query = db.query(AssetAssignment).join(Employee).filter(
            Employee.department_id == dept.department_id,
            AssetAssignment.status == "Assigned"
        )
        assigned_count = assigned_assets_query.count()
        
        # Calculate total purchase price of assigned assets
        active_assignments = assigned_assets_query.all()
        total_value = sum(
            float(assign.asset.purchase_price) for assign in active_assignments 
            if assign.asset and assign.asset.purchase_price
        )
        
        result.append({
            "department_id": dept.department_id,
            "department_name": dept.department_name,
            "status": dept.status,
            "employee_count": emp_count,
            "assigned_assets_count": assigned_count,
            "total_asset_value": round(total_value, 2)
        })
    return result


@router.get("/inventory-status")
def get_inventory_status_report(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve overall status report for consumable stock and reorder warnings"""
    query = db.query(InventoryItem)
    if status_filter:
        query = query.filter(InventoryItem.status == status_filter)
        
    items = query.order_by(InventoryItem.item_code.asc()).all()
    
    result = []
    for item in items:
        result.append({
            "inventory_id": item.inventory_id,
            "item_code": item.item_code,
            "item_name": item.item_name,
            "category": item.category or "-",
            "unit": item.unit,
            "quantity": item.quantity,
            "minimum_stock": item.minimum_stock,
            "status": item.status,
            "supplier_name": item.supplier.supplier_name if item.supplier else "-",
            "needs_reorder": item.quantity <= item.minimum_stock
        })
    return result
