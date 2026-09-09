from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PurchaseItemBase(BaseModel):
    product_id: int
    batch_number: str
    expiry_date: Optional[datetime] = None
    quantity: int
    unit_price: float
    gst_percent: float = 5.0

class PurchaseItemCreate(PurchaseItemBase):
    pass

class PurchaseItemResponse(PurchaseItemBase):
    id: int
    total_amount: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: Optional[str] = None
    invoice_date: Optional[datetime] = None
    discount_amount: float = 0.0
    paid_amount: float = 0.0
    payment_method: str = "Bank Transfer"
    notes: Optional[str] = None
    items: List[PurchaseItemCreate]

class PurchaseResponse(BaseModel):
    id: int
    purchase_number: str
    supplier_id: int
    supplier_name: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: datetime
    subtotal: float
    gst_amount: float
    discount_amount: float
    grand_total: float
    paid_amount: float
    pending_amount: float
    payment_status: str
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[PurchaseItemResponse] = []

    class Config:
        from_attributes = True
