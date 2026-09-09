from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException

from app.models.farmer import Farmer
from app.models.credit import CreditTransaction
from app.models.payment import Payment
from app.utils.invoice_numbers import generate_payment_number
from app.schemas.payment import PaymentCreate

def record_farmer_credit_payment(db: Session, payment_in: PaymentCreate) -> Payment:
    farmer = db.query(Farmer).filter(Farmer.id == payment_in.farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    if payment_in.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    pay_num = generate_payment_number(db)

    # 1. Create Payment record
    payment = Payment(
        payment_number=pay_num,
        farmer_id=farmer.id,
        bill_id=payment_in.bill_id,
        payment_type="FARMER_CREDIT_REPAYMENT",
        amount=payment_in.amount,
        payment_method=payment_in.payment_method,
        reference_number=payment_in.reference_number,
        notes=payment_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(payment)
    db.flush()

    # 2. Update Farmer balance
    farmer.pending_credit = max(0.0, farmer.pending_credit - payment_in.amount)
    db.add(farmer)

    # 3. Create Credit Transaction record (CREDIT)
    credit_trx = CreditTransaction(
        farmer_id=farmer.id,
        payment_id=payment.id,
        bill_id=payment_in.bill_id,
        transaction_type="CREDIT",
        amount=payment_in.amount,
        balance_after=farmer.pending_credit,
        notes=f"Payment received via {payment_in.payment_method}. Ref: {pay_num}"
    )
    db.add(credit_trx)

    db.commit()
    db.refresh(payment)
    return payment
