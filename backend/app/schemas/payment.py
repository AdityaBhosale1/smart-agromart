from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentCreate(BaseModel):
    farmer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    bill_id: Optional[int] = None
    purchase_id: Optional[int] = None
    payment_type: str # FARMER_CREDIT_REPAYMENT, SUPPLIER_PAYMENT, BILL_PAYMENT
    amount: float
    payment_method: str = "Cash"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    payment_number: str
    farmer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    bill_id: Optional[int] = None
    purchase_id: Optional[int] = None
    payment_type: str
    amount: float
    payment_method: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    farmer_name: Optional[str] = None
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True
