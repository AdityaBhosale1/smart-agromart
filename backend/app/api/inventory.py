from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.inventory import ProductBatch, StockMovement
from app.models.product import Product
from app.schemas.inventory import ProductBatchResponse, StockMovementResponse, StockAdjustmentRequest
from app.services.inventory_service import adjust_stock

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/batches", response_model=List[ProductBatchResponse])
def get_batches(
    product_id: Optional[int] = Query(None),
    expiring_soon: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ProductBatch).filter(ProductBatch.current_quantity > 0)
    if product_id:
        query = query.filter(ProductBatch.product_id == product_id)
    if expiring_soon:
        thirty_days = datetime.utcnow() + timedelta(days=30)
        query = query.filter(ProductBatch.expiry_date <= thirty_days)

    batches = query.order_by(ProductBatch.expiry_date.asc().nullslast()).all()

    res = []
    for b in batches:
        b_res = ProductBatchResponse.model_validate(b)
        b_res.product_name = b.product.name if b.product else "Unassigned"
        res.append(b_res)
    return res

@router.get("/movements", response_model=List[StockMovementResponse])
def get_stock_movements(product_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(StockMovement)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)

    movements = query.order_by(StockMovement.id.desc()).limit(100).all()

    res = []
    for m in movements:
        m_res = StockMovementResponse.model_validate(m)
        prod = db.query(Product).filter(Product.id == m.product_id).first()
        m_res.product_name = prod.name if prod else "Unassigned"
        res.append(m_res)
    return res

@router.post("/adjust")
def adjust_inventory_stock(adj_in: StockAdjustmentRequest, db: Session = Depends(get_db)):
    # Find batch or create default batch if batch_id is omitted
    batch_id = adj_in.batch_id
    if not batch_id:
        batch = db.query(ProductBatch).filter(
            ProductBatch.product_id == adj_in.product_id,
            ProductBatch.current_quantity > 0
        ).first()
        if not batch:
            # Create a default batch
            prod = db.query(Product).filter(Product.id == adj_in.product_id).first()
            if not prod:
                raise HTTPException(status_code=404, detail="Product not found")
            batch = ProductBatch(
                product_id=prod.id,
                batch_number="ADJ-DEFAULT",
                initial_quantity=0,
                current_quantity=0,
                purchase_price=prod.purchase_price,
                selling_price=prod.selling_price
            )
            db.add(batch)
            db.flush()
        batch_id = batch.id

    updated_batch = adjust_stock(
        db=db,
        product_id=adj_in.product_id,
        batch_id=batch_id,
        adjustment_type=adj_in.adjustment_type,
        quantity=adj_in.quantity,
        reason=adj_in.reason
    )
    db.commit()
    return {"message": "Stock adjusted successfully", "current_quantity": updated_batch.current_quantity}
