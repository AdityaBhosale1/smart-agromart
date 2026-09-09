from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from fastapi import HTTPException
from typing import List, Tuple

from app.models.product import Product
from app.models.inventory import ProductBatch, StockMovement

def update_product_total_stock(db: Session, product_id: int):
    """
    Recalculates total stock of product based on sum of current_quantity in valid non-expired product_batches.
    """
    now = datetime.utcnow()
    total_qty = db.query(func.sum(ProductBatch.current_quantity))\
        .filter(
            ProductBatch.product_id == product_id,
            ((ProductBatch.expiry_date >= now) | (ProductBatch.expiry_date == None))
        )\
        .scalar() or 0

    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.total_stock = total_qty
        db.add(product)

def allocate_stock_fefo(
    db: Session,
    product_id: int,
    requested_qty: int,
    reference_type: str = "BILL",
    reference_id: str = ""
) -> List[Tuple[ProductBatch, int]]:
    """
    First Expire, First Out (FEFO) Stock Allocation Strategy.
    1. Ensures product is active.
    2. Filters valid non-expired batches with current_quantity > 0.
    3. Sorts by expiry_date ASC (nulls last).
    4. Deducts stock across batches and records SALE stock movements.
    5. Recalculates product total stock.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product ID {product_id} not found")

    if getattr(product, "status", "Active") != "Active":
        raise HTTPException(status_code=400, detail=f"Product '{product.name}' is currently inactive and cannot be sold.")

    now = datetime.utcnow()

    # Query non-expired batches ordered by expiry_date ASC
    batches = db.query(ProductBatch).filter(
        ProductBatch.product_id == product_id,
        ProductBatch.current_quantity > 0,
        ((ProductBatch.expiry_date >= now) | (ProductBatch.expiry_date == None))
    ).order_by(ProductBatch.expiry_date.asc().nullslast()).all()

    total_available = sum(b.current_quantity for b in batches)
    if total_available < requested_qty:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for product '{product.name}'. Available: {total_available} {product.unit or 'units'}, Requested: {requested_qty}"
        )

    remaining_to_allocate = requested_qty
    allocations: List[Tuple[ProductBatch, int]] = []

    for batch in batches:
        if remaining_to_allocate <= 0:
            break

        take_qty = min(batch.current_quantity, remaining_to_allocate)
        batch.current_quantity -= take_qty
        db.add(batch)
        remaining_to_allocate -= take_qty

        # Record stock movement as SALE
        movement = StockMovement(
            product_id=product_id,
            batch_id=batch.id,
            movement_type="SALE",
            quantity=take_qty,
            reference_type=reference_type,
            reference_id=str(reference_id),
            notes=f"FEFO sale allocation from batch {batch.batch_number}"
        )
        db.add(movement)
        allocations.append((batch, take_qty))

    # Flush session changes so DB sum queries pick up updated batch quantities
    db.flush()

    # Update product total stock
    update_product_total_stock(db, product_id)

    return allocations

def adjust_stock(db: Session, product_id: int, batch_id: int, adjustment_type: str, quantity: int, reason: str):
    """
    Manual stock adjustment (ADD or REDUCE).
    """
    batch = db.query(ProductBatch).filter(ProductBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if adjustment_type.upper() == "REDUCE":
        if batch.current_quantity < quantity:
            raise HTTPException(status_code=400, detail="Cannot reduce stock below 0")
        batch.current_quantity -= quantity
        mov_type = "ADJUSTMENT_REDUCE"
    else:
        batch.current_quantity += quantity
        mov_type = "ADJUSTMENT_ADD"

    db.add(batch)
    movement = StockMovement(
        product_id=product_id,
        batch_id=batch_id,
        movement_type=mov_type,
        quantity=quantity,
        reference_type="MANUAL_ADJUSTMENT",
        notes=reason
    )
    db.add(movement)
    db.flush()
    update_product_total_stock(db, product_id)
    return batch
