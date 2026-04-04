from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routers import users, policies, claims, wallets, community_fund

# Import all models so Base.metadata.create_all sees them
from app.models import user, policy, claim, wallet, community_fund as cf_model

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zoink-4-u Core Backend",
    description="Backend API for Registration, Policy Management, Claims, Disruption Shield, and Community Fund.",
    version="0.2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(wallets.router)
app.include_router(community_fund.router)

@app.get("/health")
def read_health():
    return {"status": "healthy", "version": "0.2.0", "features": ["shield", "buyback", "safe_return", "community_fund"]}

