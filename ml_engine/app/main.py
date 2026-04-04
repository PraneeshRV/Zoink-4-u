from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.services.pricing_model import calculate_dynamic_premium
from app.routers import mock_api

app = FastAPI(title="Zoink-4-u ML Engine", version="0.1.0")

# CORS - allow frontend on port 5173 to reach this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mock_api.router)

class PricingRequest(BaseModel):
    zone_id: str
    tier: str
    work_hours_estimated: int = 40

class PricingResponse(BaseModel):
    base_premium: float
    dynamic_premium: float
    risk_score: float
    factors: dict

@app.post("/pricing/calculate", response_model=PricingResponse)
def calculate_pricing(req: PricingRequest):
    # Call our mocked ML model to compute dynamic premium
    result = calculate_dynamic_premium(req.zone_id, req.tier, req.work_hours_estimated)
    return result

@app.get("/health")
def read_health():
    return {"status": "ml_engine_healthy"}
