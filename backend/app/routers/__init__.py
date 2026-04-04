from app.routers.auth import router as auth_router
from app.routers.riders import router as riders_router
from app.routers.policies import router as policies_router
from app.routers.triggers import router as triggers_router
from app.routers.claims import router as claims_router
from app.routers.payouts import router as payouts_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router", "riders_router", "policies_router",
    "triggers_router", "claims_router", "payouts_router", "admin_router",
]
