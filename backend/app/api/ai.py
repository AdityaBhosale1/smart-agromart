from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.schemas.ai import DemandForecastItem, FarmerCropRecommendation, AISummaryMetrics
from app.services.ai_service import get_ai_demand_forecast, get_farmer_ai_recommendations, get_ai_metrics

router = APIRouter(prefix="/ai", tags=["AI Insights"])

@router.get("/forecast", response_model=List[DemandForecastItem])
def ai_forecast(db: Session = Depends(get_db)):
    return get_ai_demand_forecast(db)

@router.get("/recommendations", response_model=List[FarmerCropRecommendation])
def ai_recommendations(db: Session = Depends(get_db)):
    return get_farmer_ai_recommendations(db)

@router.get("/metrics", response_model=AISummaryMetrics)
def ai_metrics(db: Session = Depends(get_db)):
    return get_ai_metrics(db)
