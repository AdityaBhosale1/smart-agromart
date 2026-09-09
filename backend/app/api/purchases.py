from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseItemResponse
from app.services.purchase_service import create_purchase_inward

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.get("/", response_model=List[PurchaseResponse])
def get_purchases(
    supplier_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Purchase)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if status:
        query = query.filter(Purchase.payment_status == status)

    purchases = query.order_by(Purchase.id.desc()).all()

    res = []
    for p in purchases:
        p_res = PurchaseResponse.model_validate(p)
        p_res.supplier_name = p.supplier.company_name if p.supplier else (p.supplier.name if p.supplier else "Supplier")
        
        # items detail
        p_res.items = [
            PurchaseItemResponse(
                id=item.id,
                product_id=item.product_id,
                batch_number=item.batch_number,
                expiry_date=item.expiry_date,
                quantity=item.quantity,
                unit_price=item.unit_price,
                gst_percent=item.gst_percent,
                total_amount=item.total_amount,
                product_name=item.product.name if item.product else "Product"
            )
            for item in p.items
        ]
        res.append(p_res)
    return res

@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase record not found")

    p_res = PurchaseResponse.model_validate(p)
    p_res.supplier_name = p.supplier.company_name if p.supplier else "Supplier"
    p_res.items = [
        PurchaseItemResponse(
            id=item.id,
            product_id=item.product_id,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            total_amount=item.total_amount,
            product_name=item.product.name if item.product else "Product"
        )
        for item in p.items
    ]
    return p_res

@router.post("/", response_model=PurchaseResponse)
def create_purchase(purchase_in: PurchaseCreate, db: Session = Depends(get_db)):
    pur = create_purchase_inward(db, purchase_in)
    p_res = PurchaseResponse.model_validate(pur)
    p_res.supplier_name = pur.supplier.company_name if pur.supplier else "Supplier"
    p_res.items = [
        PurchaseItemResponse(
            id=item.id,
            product_id=item.product_id,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            total_amount=item.total_amount,
            product_name=item.product.name if item.product else "Product"
        )
        for item in pur.items
    ]
    return p_res
