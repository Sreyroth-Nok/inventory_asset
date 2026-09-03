from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.user_log import UserLog
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserResponse
from app.core.security import verify_password, create_access_token
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 compatible token login, get an access token for future requests"""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        
    role_name = user.role.role_name if user.role else "Inventory Staff"
    
    # Record User Login Log
    user_log = UserLog(
        user_id=user.user_id,
        username=user.username,
        login_time=datetime.utcnow(),
        status="Active"
    )
    db.add(user_log)
    db.commit()

    access_token = create_access_token(data={"sub": user.username, "role": role_name, "user_id": user.user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/json", response_model=Token)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    """JSON payload login endpoint for web and mobile frontend applications"""
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if user.status != "Active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
        
    role_name = user.role.role_name if user.role else "Inventory Staff"

    # Record User Login Log
    user_log = UserLog(
        user_id=user.user_id,
        username=user.username,
        login_time=datetime.utcnow(),
        status="Active"
    )
    db.add(user_log)
    db.commit()

    access_token = create_access_token(data={"sub": user.username, "role": role_name, "user_id": user.user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Record user logout timestamp for active user session"""
    active_log = db.query(UserLog).filter(
        UserLog.user_id == current_user.user_id,
        UserLog.status == "Active"
    ).order_by(UserLog.login_time.desc()).first()
    
    if active_log:
        active_log.logout_time = datetime.utcnow()
        active_log.status = "Logged Out"
        db.commit()
    return {"message": "User logged out successfully"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get profile information of currently authenticated user"""
    return current_user

