from sqlalchemy.orm import Session
from datetime import datetime
from fastapi import HTTPException

from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.inventory import ProductBatch, StockMovement
from app.utils.invoice_numbers import generate_purchase_number
from app.services.inventory_service import update_product_total_stock
from app.schemas.purchase import PurchaseCreate

def create_purchase_inward(db: Session, purchase_in: PurchaseCreate) -> Purchase:
    """
    Creates purchase inward stock entry:
    - Generates purchase number (e.g. PUR-2026-00001)
    - Adds/Updates Supplier purchase history and pending payment
    - Creates new ProductBatch for each inward line item
    - Records StockMovement (INWARD)
    - Updates Product total_stock and purchase_price
    """
    supplier = db.query(Supplier).filter(Supplier.id == purchase_in.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    pur_num = generate_purchase_number(db)

    subtotal = 0.0
    gst_total = 0.0
    purchase_items_to_create = []

    for item in purchase_in.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

        line_subtotal = item.quantity * item.unit_price
        line_gst = line_subtotal * (item.gst_percent / 100.0)
        line_grand = line_subtotal + line_gst

        subtotal += line_subtotal
        gst_total += line_gst

        p_item = PurchaseItem(
            product_id=product.id,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date,
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_percent=item.gst_percent,
            total_amount=line_grand
        )
        purchase_items_to_create.append((p_item, product))

    grand_total = subtotal + gst_total - purchase_in.discount_amount
    pending_amt = max(0.0, grand_total - purchase_in.paid_amount)

    payment_status = "Paid"
    if pending_amt > 0 and purchase_in.paid_amount > 0:
        payment_status = "Partial"
    elif pending_amt > 0 and purchase_in.paid_amount == 0:
        payment_status = "Pending"

    purchase = Purchase(
        purchase_number=pur_num,
        supplier_id=supplier.id,
        invoice_number=purchase_in.invoice_number or pur_num,
        invoice_date=purchase_in.invoice_date or datetime.utcnow(),
        subtotal=round(subtotal, 2),
        gst_amount=round(gst_total, 2),
        discount_amount=round(purchase_in.discount_amount, 2),
        grand_total=round(grand_total, 2),
        paid_amount=round(purchase_in.paid_amount, 2),
        pending_amount=round(pending_amt, 2),
        payment_status=payment_status,
        payment_method=purchase_in.payment_method,
        notes=purchase_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(purchase)
    db.flush()

    for p_item, product in purchase_items_to_create:
        p_item.purchase_id = purchase.id
        db.add(p_item)

        # Create ProductBatch
        batch = ProductBatch(
            product_id=product.id,
            batch_number=p_item.batch_number,
            expiry_date=p_item.expiry_date,
            initial_quantity=p_item.quantity,
            current_quantity=p_item.quantity,
            purchase_price=p_item.unit_price,
            selling_price=product.selling_price,
            supplier_id=supplier.id
        )
        db.add(batch)
        db.flush()

        # Stock Movement INWARD
        movement = StockMovement(
            product_id=product.id,
            batch_id=batch.id,
            movement_type="INWARD",
            quantity=p_item.quantity,
            reference_type="PURCHASE",
            reference_id=pur_num,
            notes=f"Stock inward from Supplier {supplier.name}"
        )
        db.add(movement)

        # Update product purchase price & stock
        product.purchase_price = p_item.unit_price
        update_product_total_stock(db, product.id)

    # Update Supplier metrics
    supplier.total_purchases += grand_total
    supplier.pending_payment += pending_amt
    db.add(supplier)

    db.commit()
    db.refresh(purchase)
    return purchase
