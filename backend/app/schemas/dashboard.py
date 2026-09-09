from pydantic import BaseModel
from typing import List, Optional

class DashboardKPI(BaseModel):
    id: str
    title: str
    value: str
    change: str
    icon: Optional[str] = None
    color: Optional[str] = None

class ChartDataPoint(BaseModel):
    label: str
    sales: float
    purchases: float
    credit: float

class DashboardSummaryResponse(BaseModel):
    kpis: List[DashboardKPI]
    recent_bills: List[dict]
    low_stock_products: List[dict]
    expiring_batches: List[dict]
    chart_data: List[ChartDataPoint]
