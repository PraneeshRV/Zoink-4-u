from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import hashlib
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin

router = APIRouter(prefix="/users", tags=["Registration"])

@router.post("/register", response_model=UserResponse)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.aadhaar_otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid Aadhaar OTP")
        
    # Generate Aadhaar Token (privacy-preserving one-way hash)
    token = hashlib.sha256(user_in.aadhaar_number.encode()).hexdigest()
    
    db_user = db.query(User).filter(User.aadhaar_token == token).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already registered")

    new_user = User(
        name=user_in.name,
        phone=user_in.phone,
        zone_id=user_in.zone_id,
        aadhaar_token=token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
def login_user(login_in: UserLogin, db: Session = Depends(get_db)):
    # Mock OTP verification
    if login_in.aadhaar_otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    db_user = db.query(User).filter(User.phone == login_in.phone).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please register.")
        
    return db_user
