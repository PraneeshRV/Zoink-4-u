from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    name: str
    phone: str
    zone_id: str

class UserCreate(UserBase):
    aadhaar_otp: str # Simulated OTP for registration
    aadhaar_number: str

class UserLogin(BaseModel):
    phone: str
    aadhaar_otp: str

class UserResponse(UserBase):
    id: int
    aadhaar_token: str
    created_at: datetime

    class Config:
        from_attributes = True
