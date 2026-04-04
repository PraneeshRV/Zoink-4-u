"""Auth routes: register and login with mock OTP."""
import hashlib
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import create_access_token
from app.models.rider import Rider
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from datetime import time as dt_time

router = APIRouter(prefix="/auth", tags=["Auth"])


def parse_time(t: str) -> dt_time:
    parts = t.split(":")
    return dt_time(int(parts[0]), int(parts[1]))


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        if req.mock_otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP. Use 123456 for demo.")

        # Check if phone already exists
        existing = await db.execute(select(Rider).where(Rider.phone == req.phone))
        rider = existing.scalar_one_or_none()
        if rider:
            # Return token for existing rider
            token = create_access_token({"rider_id": str(rider.id), "phone": rider.phone})
            return TokenResponse(
                access_token=token, rider_id=str(rider.id), name=rider.name
            )

        aadhaar_token = hashlib.sha256(f"{req.phone}{req.aadhaar_last4}".encode()).hexdigest()

        rider = Rider(
            aadhaar_token=aadhaar_token,
            name=req.name,
            phone=req.phone,
            platform=req.platform,
            zone_h3=req.zone_h3,
            city=req.city,
            shift_start=parse_time(req.shift_start),
            shift_end=parse_time(req.shift_end),
            zoink_score=50,
            is_verified=True,
        )
        db.add(rider)
        await db.commit()
        await db.refresh(rider)

        token = create_access_token({"rider_id": str(rider.id), "phone": rider.phone})
        return TokenResponse(
            access_token=token, rider_id=str(rider.id), name=rider.name
        )
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        if req.mock_otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP. Use 123456 for demo.")

        result = await db.execute(select(Rider).where(Rider.phone == req.phone))
        rider = result.scalar_one_or_none()
        if not rider:
            raise HTTPException(status_code=404, detail="Phone number not registered")

        token = create_access_token({"rider_id": str(rider.id), "phone": rider.phone})
        return TokenResponse(
            access_token=token, rider_id=str(rider.id), name=rider.name
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
