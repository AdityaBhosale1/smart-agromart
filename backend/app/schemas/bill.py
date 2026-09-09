from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BillItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: Optional[float] = None
    discount_amount: Optional[float] = 0.0
    batch_id: Optional[int] = None
    batch_number: Optional[str] = None

class BillItemResponse(BaseModel):
    id: int
    bill_id: Optional[int] = None
    product_id: int
    batch_id: Optional[int] = None
    product_name: str
    batch_number: Optional[str] = None
    unit: Optional[str] = "Bags"
    hsn_code: Optional[str] = None
    quantity: int
    unit_price: float
    rate: float
    gst_percent: float
    discount_amount: float = 0.0
    taxable_amount: float
    gst_amount: float
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    total_amount: float

    class Config:
        from_attributes = True

class BillCreate(BaseModel):
    farmer_id: Optional[int] = None
    farmer_name: Optional[str] = "Walk-in Customer"
    farmer_mobile: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    paid_amount: Optional[float] = 0.0
    cash_amount: Optional[float] = 0.0
    upi_amount: Optional[float] = 0.0
    payment_method: str = "CASH" # CASH, UPI, CREDIT, SPLIT, BANK_TRANSFER
    due_date: Optional[str] = None
    notes: Optional[str] = None
    items: List[BillItemCreate]

class BillResponse(BaseModel):
    id: int
    invoice_number: str
    invoice_date: Optional[datetime] = None
    farmer_id: Optional[int] = None
    farmer_name: str
    farmer_mobile: Optional[str] = None
    subtotal: float
    taxable_amount: float = 0.0
    gst_amount: float
    cgst: float = 0.0
    sgst: float = 0.0
    igst: float = 0.0
    discount_amount: float
    grand_total: float
    paid_amount: float
    pending_amount: float
    payment_method: str
    payment_status: str
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[BillItemResponse] = []

    class Config:
        from_attributes = True
