from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.category import AssetCategory
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.models.user import User
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/categories", tags=["Asset Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AssetCategory)
    if status_filter:
        query = query.filter(AssetCategory.status == status_filter)
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    category = AssetCategory(**cat_in.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = db.query(AssetCategory).filter(AssetCategory.category_id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    cat_in: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Manager", "Inventory Staff"]))
):
    cat = db.query(AssetCategory).filter(AssetCategory.category_id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for key, value in cat_in.model_dump(exclude_unset=True).items():
        setattr(cat, key, value)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin"]))
):
    cat = db.query(AssetCategory).filter(AssetCategory.category_id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return None
