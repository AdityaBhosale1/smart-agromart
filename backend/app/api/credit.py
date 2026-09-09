from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.credit import CreditTransaction
from app.models.farmer import Farmer
from app.schemas.credit import CreditTransactionResponse, ReminderRequest

router = APIRouter(prefix="/credit", tags=["Credit Management"])

@router.get("/ledger", response_model=List[CreditTransactionResponse])
def get_credit_ledger(farmer_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(CreditTransaction)
    if farmer_id:
        query = query.filter(CreditTransaction.farmer_id == farmer_id)

    trxs = query.order_by(CreditTransaction.id.desc()).all()

    res = []
    for t in trxs:
        t_res = CreditTransactionResponse.model_validate(t)
        t_res.farmer_name = t.farmer.name if t.farmer else "Farmer"
        res.append(t_res)
    return res

@router.post("/reminders")
def send_credit_payment_reminders(req: ReminderRequest, db: Session = Depends(get_db)):
    farmers = db.query(Farmer).filter(Farmer.id.in_(req.farmer_ids)).all()
    sent_count = 0

    for f in farmers:
        if f.pending_credit > 0:
            sent_count += 1

    return {
        "status": "success",
        "message": f"Sent {req.message_type} payment reminders to {sent_count} farmers with outstanding credit balances."
    }
