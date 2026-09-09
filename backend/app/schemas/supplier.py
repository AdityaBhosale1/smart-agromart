from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    company_name: str
    mobile: str
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    status: str = "Active"

class SupplierCreate(SupplierBase):
    supplier_code: Optional[str] = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None

class SupplierResponse(SupplierBase):
    id: int
    supplier_code: str
    total_purchases: float
    pending_payment: float
    created_at: datetime

    class Config:
        from_attributes = True
