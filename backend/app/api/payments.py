from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services.credit_service import record_farmer_credit_payment

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    farmer_id: Optional[int] = Query(None),
    supplier_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    if farmer_id:
        query = query.filter(Payment.farmer_id == farmer_id)
    if supplier_id:
        query = query.filter(Payment.supplier_id == supplier_id)

    payments = query.order_by(Payment.id.desc()).all()

    res = []
    for p in payments:
        p_res = PaymentResponse.model_validate(p)
        p_res.farmer_name = p.farmer.name if p.farmer else None
        p_res.supplier_name = p.supplier.company_name if p.supplier else None
        res.append(p_res)
    return res

@router.post("/repayment", response_model=PaymentResponse)
def create_credit_repayment(payment_in: PaymentCreate, db: Session = Depends(get_db)):
    pay = record_farmer_credit_payment(db, payment_in)
    p_res = PaymentResponse.model_validate(pay)
    p_res.farmer_name = pay.farmer.name if pay.farmer else None
    return p_res
