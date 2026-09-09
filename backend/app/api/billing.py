from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.bill import Bill
from app.schemas.bill import BillCreate, BillResponse, BillItemResponse
from app.services.billing_service import create_bill_transactional
from app.core.security import get_current_user_optional
from app.models.user import User

router = APIRouter(tags=["Billing"])

def format_bill_response(b: Bill) -> BillResponse:
    b_res = BillResponse.model_validate(b)
    b_res.items = [BillItemResponse.model_validate(item) for item in b.items]
    return b_res

@router.get("/billing/bills", response_model=List[BillResponse])
@router.get("/billing/bills/", response_model=List[BillResponse])
@router.get("/bills", response_model=List[BillResponse])
@router.get("/bills/", response_model=List[BillResponse])
def get_bills(
    search: Optional[str] = Query(None),
    farmer_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Bill)
    if search:
        s = f"%{search}%"
        query = query.filter((Bill.invoice_number.like(s)) | (Bill.farmer_name.like(s)))
    if farmer_id:
        query = query.filter(Bill.farmer_id == farmer_id)
    if status:
        query = query.filter(Bill.payment_status == status)

    bills = query.order_by(Bill.id.desc()).all()
    return [format_bill_response(b) for b in bills]

@router.get("/billing/bills/{bill_id}", response_model=BillResponse)
@router.get("/bills/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    b = db.query(Bill).filter(Bill.id == bill_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bill not found")
    return format_bill_response(b)

@router.get("/billing/invoice/{invoice_number}", response_model=BillResponse)
@router.get("/bills/invoice/{invoice_number}", response_model=BillResponse)
def get_bill_by_invoice(invoice_number: str, db: Session = Depends(get_db)):
    b = db.query(Bill).filter(Bill.invoice_number == invoice_number).first()
    if not b:
        raise HTTPException(status_code=404, detail=f"Bill with invoice #{invoice_number} not found")
    return format_bill_response(b)

@router.post("/billing/checkout", response_model=BillResponse)
@router.post("/billing/checkout/", response_model=BillResponse)
@router.post("/bills", response_model=BillResponse)
@router.post("/bills/", response_model=BillResponse)
def create_bill_endpoint(
    bill_in: BillCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else None
    bill = create_bill_transactional(db=db, bill_in=bill_in, user_id=user_id)
    return format_bill_response(bill)
