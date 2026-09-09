from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FarmerBase(BaseModel):
    name: str
    mobile: str
    village: Optional[str] = None
    district: Optional[str] = None
    land_acreage: float = 0.0
    primary_crop: Optional[str] = None
    credit_limit: float = 50000.0
    status: str = "Active"

class FarmerCreate(FarmerBase):
    farmer_code: Optional[str] = None
    pending_credit: float = 0.0

class FarmerUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    land_acreage: Optional[float] = None
    primary_crop: Optional[str] = None
    credit_limit: Optional[float] = None
    status: Optional[str] = None

class FarmerResponse(FarmerBase):
    id: int
    farmer_code: str
    pending_credit: float
    created_at: datetime

    class Config:
        from_attributes = True
