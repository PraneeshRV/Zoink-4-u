"""
Zoink-4-u ML Engine — FastAPI Application
Premium calculation, fraud detection, risk profiling, disruption forecast.
"""
import logging
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.premium import router as premium_router
from app.routers.fraud import router as fraud_router
from app.routers.risk import router as risk_router
from app.routers.forecast import router as forecast_router

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="Zoink-4-u ML Engine",
    description="ML models for premium pricing, fraud detection, risk profiling",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://zoink4u.praneeshrv.me", "http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(premium_router)
app.include_router(fraud_router)
app.include_router(risk_router)
app.include_router(forecast_router)


@app.get("/health")
async def health():
    return {"status": "ml_engine_healthy", "version": "2.0.0"}
