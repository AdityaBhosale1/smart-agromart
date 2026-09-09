from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from app.core.database import get_db
from app.models.settings import AppSetting
from app.schemas.settings import SettingsBatchUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/")
def get_all_settings(db: Session = Depends(get_db)) -> Dict[str, str]:
    settings = db.query(AppSetting).all()
    res = {s.key: s.value for s in settings}
    if not res:
        # Default fallback settings
        res = {
            "shop_name": "Smart AgroMart",
            "tagline": "AI-Powered Agricultural Shop",
            "mobile": "+91 98765 43210",
            "gstin": "27AAACG1234F1Z5",
            "address": "Main Market Road, Krishi Mandi, Solapur, Maharashtra - 413001",
            "currency_symbol": "₹",
            "invoice_prefix": "AGM",
            "enable_fefo": "true",
            "low_stock_threshold": "10",
            "enable_sms_alerts": "true"
        }
    return res

@router.post("/")
def update_settings(update_in: SettingsBatchUpdate, db: Session = Depends(get_db)):
    for key, val in update_in.settings.items():
        item = db.query(AppSetting).filter(AppSetting.key == key).first()
        if item:
            item.value = str(val)
        else:
            item = AppSetting(key=key, value=str(val))
            db.add(item)

    db.commit()
    return {"message": "Settings updated successfully"}
