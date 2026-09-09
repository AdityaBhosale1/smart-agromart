from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CreditTransactionResponse(BaseModel):
    id: int
    farmer_id: int
    farmer_name: Optional[str] = None
    bill_id: Optional[int] = None
    payment_id: Optional[int] = None
    transaction_type: str # DEBIT, CREDIT
    amount: float
    balance_after: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReminderRequest(BaseModel):
    farmer_ids: list[int]
    message_type: str = "SMS" # SMS, WhatsApp
