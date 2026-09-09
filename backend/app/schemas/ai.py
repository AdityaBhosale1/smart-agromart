from pydantic import BaseModel
from typing import List, Optional

class DemandForecastItem(BaseModel):
    product_name: str
    category: str
    current_stock: int
    predicted_demand_next_30_days: int
    recommended_reorder_qty: int
    confidence_score: float
    reason: str

class FarmerCropRecommendation(BaseModel):
    farmer_name: str
    crop: str
    recommended_fertilizer: str
    recommended_pesticide: str
    estimated_cost: float
    next_action: str

class AISummaryMetrics(BaseModel):
    sales_growth_prediction: str
    high_demand_category: str
    optimal_stock_health: str
    credit_risk_index: str
