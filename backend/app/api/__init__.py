from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.farmers import router as farmers_router
from app.api.suppliers import router as suppliers_router
from app.api.products import router as products_router
from app.api.inventory import router as inventory_router
from app.api.purchases import router as purchases_router
from app.api.billing import router as billing_router
from app.api.payments import router as payments_router
from app.api.credit import router as credit_router
from app.api.reports import router as reports_router
from app.api.ai import router as ai_router
from app.api.notifications import router as notifications_router
from app.api.settings import router as settings_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(farmers_router)
api_router.include_router(suppliers_router)
api_router.include_router(products_router)
api_router.include_router(inventory_router)
api_router.include_router(purchases_router)
api_router.include_router(billing_router)
api_router.include_router(payments_router)
api_router.include_router(credit_router)
api_router.include_router(reports_router)
api_router.include_router(ai_router)
api_router.include_router(notifications_router)
api_router.include_router(settings_router)
