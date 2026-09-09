from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from fastapi import HTTPException
from typing import List, Optional

from app.models.bill import Bill, BillItem
from app.models.farmer import Farmer
from app.models.credit import CreditTransaction
from app.models.payment import Payment
from app.models.product import Product
from app.utils.invoice_numbers import generate_bill_invoice_number, generate_payment_number
from app.services.inventory_service import allocate_stock_fefo
from app.schemas.bill import BillCreate

def round_curr(val: Decimal) -> float:
    return float(val.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

def create_bill_transactional(db: Session, bill_in: BillCreate, user_id: Optional[int] = None) -> Bill:
    """
    Creates a bill inside a single atomic database transaction.
    - Validates Farmer & Products
    - Validates Credit Limit & Prevents Anonymous Credit Sales
    - Performs FEFO Stock Allocation across non-expired batches
    - Calculates Taxable Amount, CGST, SGST, IGST, Subtotal, Grand Total using Decimal precision
    - Reduces Product Batch Stock and Records SALE Stock Movements
    - Creates Payment Record(s) for Cash/UPI/Split payments
    - Updates Farmer Pending Credit & Logs CreditTransaction for Khata
    - Generates Sequential Invoice Number (AGM-YYYY-XXXXX)
    - Full rollback on failure
    """

    try:
        # 1. Generate sequential invoice number
        invoice_num = generate_bill_invoice_number(db)

        # 2. Fetch & Validate Farmer
        farmer = None
        if bill_in.farmer_id:
            farmer = db.query(Farmer).filter(Farmer.id == bill_in.farmer_id).first()
            if not farmer:
                raise HTTPException(status_code=404, detail=f"Farmer ID {bill_in.farmer_id} not found")

        farmer_name = farmer.name if farmer else (bill_in.farmer_name or "Walk-in Customer")
        farmer_mobile = farmer.mobile if farmer else bill_in.farmer_mobile

        bill_items_to_create = []
        subtotal_dec = Decimal('0.0')
        gst_total_dec = Decimal('0.0')

        # 3. Process line items with FEFO allocation
        if not bill_in.items:
            raise HTTPException(status_code=400, detail="Cannot generate empty bill. Please add at least one item.")

        for item in bill_in.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

            if getattr(product, "status", "Active") != "Active":
                raise HTTPException(status_code=400, detail=f"Product '{product.name}' is inactive and cannot be sold.")

            if item.quantity <= 0:
                raise HTTPException(status_code=400, detail=f"Quantity for product '{product.name}' must be greater than zero.")

            unit_rate = Decimal(str(item.unit_price)) if (item.unit_price is not None and item.unit_price > 0) else Decimal(str(product.selling_price))
            item_discount = Decimal(str(item.discount_amount or 0.0))

            # Perform FEFO allocation
            allocations = allocate_stock_fefo(
                db=db,
                product_id=product.id,
                requested_qty=item.quantity,
                reference_type="BILL",
                reference_id=invoice_num
            )

            # Create BillItem per batch allocation for full batch traceability
            for batch, qty in allocations:
                alloc_qty_dec = Decimal(str(qty))
                fraction = alloc_qty_dec / Decimal(str(item.quantity))
                alloc_disc = item_discount * fraction

                alloc_gross = alloc_qty_dec * unit_rate
                alloc_taxable = alloc_gross - alloc_disc
                gst_pct = Decimal(str(product.gst_percent or 5.0))
                alloc_gst = alloc_taxable * (gst_pct / Decimal('100.0'))
                alloc_cgst = alloc_gst / Decimal('2.0')
                alloc_sgst = alloc_gst / Decimal('2.0')
                alloc_total = alloc_taxable + alloc_gst

                subtotal_dec += alloc_taxable
                gst_total_dec += alloc_gst

                b_item = BillItem(
                    product_id=product.id,
                    batch_id=batch.id,
                    product_name=product.name,
                    batch_number=batch.batch_number,
                    unit=product.unit or "Bags",
                    hsn_code=product.hsn_code or "3105",
                    quantity=qty,
                    unit_price=round_curr(unit_rate),
                    rate=round_curr(unit_rate),
                    gst_percent=round_curr(gst_pct),
                    discount_amount=round_curr(alloc_disc),
                    taxable_amount=round_curr(alloc_taxable),
                    gst_amount=round_curr(alloc_gst),
                    cgst=round_curr(alloc_cgst),
                    sgst=round_curr(alloc_sgst),
                    igst=0.0,
                    total_amount=round_curr(alloc_total)
                )
                bill_items_to_create.append(b_item)

        overall_discount = Decimal(str(bill_in.discount_amount or 0.0))
        grand_total_dec = subtotal_dec + gst_total_dec - overall_discount
        if grand_total_dec < Decimal('0.0'):
            grand_total_dec = Decimal('0.0')

        # Calculate paid vs pending
        cash_amt = Decimal(str(bill_in.cash_amount or 0.0))
        upi_amt = Decimal(str(bill_in.upi_amount or 0.0))
        
        pay_method_upper = (bill_in.payment_method or "CASH").upper()

        if cash_amt > 0 or upi_amt > 0:
            total_paid = cash_amt + upi_amt
        elif bill_in.paid_amount and bill_in.paid_amount > 0:
            total_paid = Decimal(str(bill_in.paid_amount))
        elif pay_method_upper in ["CASH", "UPI", "CARD", "BANK_TRANSFER"] and not bill_in.farmer_id:
            # Walk-in cash customer defaulting to full payment
            total_paid = grand_total_dec
        else:
            total_paid = Decimal(str(bill_in.paid_amount or 0.0))

        pending_dec = grand_total_dec - total_paid
        if pending_dec < Decimal('0.01'):
            pending_dec = Decimal('0.0')

        # 4. Credit checks for credit or partial sales
        if pending_dec > Decimal('0.0'):
            if not farmer:
                raise HTTPException(
                    status_code=400,
                    detail="Farmer profile is required for credit / partial payment sales. Anonymous credit sales are not allowed."
                )

            current_pending = Decimal(str(farmer.pending_credit or 0.0))
            limit = Decimal(str(farmer.credit_limit or 0.0))
            new_potential = current_pending + pending_dec

            if limit > 0 and new_potential > limit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Credit limit exceeded for farmer '{farmer.name}'. Limit: ₹{round_curr(limit):,.2f}, Current Pending Credit: ₹{round_curr(current_pending):,.2f}, New Credit Requested: ₹{round_curr(pending_dec):,.2f}"
                )

        payment_status = "Paid"
        if pending_dec > Decimal('0.0') and total_paid > Decimal('0.0'):
            payment_status = "Partial"
        elif pending_dec > Decimal('0.0') and total_paid == Decimal('0.0'):
            payment_status = "Credit"

        due_date_dt = None
        if bill_in.due_date:
            try:
                due_date_dt = datetime.fromisoformat(bill_in.due_date.replace("Z", "+00:00"))
            except Exception:
                pass

        # 5. Create Bill Header
        bill = Bill(
            invoice_number=invoice_num,
            farmer_id=farmer.id if farmer else None,
            farmer_name=farmer_name,
            farmer_mobile=farmer_mobile,
            subtotal=round_curr(subtotal_dec),
            taxable_amount=round_curr(subtotal_dec),
            gst_amount=round_curr(gst_total_dec),
            cgst=round_curr(gst_total_dec / Decimal('2.0')),
            sgst=round_curr(gst_total_dec / Decimal('2.0')),
            igst=0.0,
            discount_amount=round_curr(overall_discount),
            grand_total=round_curr(grand_total_dec),
            paid_amount=round_curr(total_paid),
            pending_amount=round_curr(pending_dec),
            payment_method=bill_in.payment_method or "Cash",
            payment_status=payment_status,
            due_date=due_date_dt,
            notes=bill_in.notes,
            created_by_id=user_id,
            created_at=datetime.utcnow()
        )
        db.add(bill)
        db.flush() # Populate bill.id

        # 6. Associate items
        for b_item in bill_items_to_create:
            b_item.bill_id = bill.id
            db.add(b_item)

        # 7. Create Payment Records
        if cash_amt > 0:
            pay_no = generate_payment_number(db)
            p_cash = Payment(
                payment_number=pay_no,
                farmer_id=farmer.id if farmer else None,
                bill_id=bill.id,
                payment_type="BILL_PAYMENT",
                amount=round_curr(cash_amt),
                payment_method="Cash",
                notes=f"Cash payment for Invoice #{invoice_num}"
            )
            db.add(p_cash)

        if upi_amt > 0:
            pay_no = generate_payment_number(db)
            p_upi = Payment(
                payment_number=pay_no,
                farmer_id=farmer.id if farmer else None,
                bill_id=bill.id,
                payment_type="BILL_PAYMENT",
                amount=round_curr(upi_amt),
                payment_method="UPI",
                notes=f"UPI payment for Invoice #{invoice_num}"
            )
            db.add(p_upi)

        if cash_amt == 0 and upi_amt == 0 and total_paid > 0:
            pay_no = generate_payment_number(db)
            p_single = Payment(
                payment_number=pay_no,
                farmer_id=farmer.id if farmer else None,
                bill_id=bill.id,
                payment_type="BILL_PAYMENT",
                amount=round_curr(total_paid),
                payment_method=bill_in.payment_method or "Cash",
                notes=f"Payment for Invoice #{invoice_num}"
            )
            db.add(p_single)

        # 8. Handle Credit Transaction if pending credit exists
        if farmer and pending_dec > 0:
            farmer.pending_credit = round_curr(Decimal(str(farmer.pending_credit or 0.0)) + pending_dec)
            db.add(farmer)

            credit_trx = CreditTransaction(
                farmer_id=farmer.id,
                bill_id=bill.id,
                transaction_type="DEBIT",
                amount=round_curr(pending_dec),
                balance_after=farmer.pending_credit,
                notes=f"Credit sale on Invoice #{invoice_num}"
            )
            db.add(credit_trx)

        db.commit()
        db.refresh(bill)
        return bill

    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Bill creation transaction failed: {str(e)}")

def get_bills_filtered(
    db: Session,
    search: Optional[str] = None,
    farmer_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
) -> List[Bill]:
    query = db.query(Bill)
    if search:
        s = f"%{search}%"
        query = query.filter((Bill.invoice_number.like(s)) | (Bill.farmer_name.like(s)))
    if farmer_id:
        query = query.filter(Bill.farmer_id == farmer_id)
    if payment_status:
        query = query.filter(Bill.payment_status == payment_status)

    return query.order_by(Bill.id.desc()).offset(skip).limit(limit).all()

def get_bill_by_id(db: Session, bill_id: int) -> Optional[Bill]:
    return db.query(Bill).filter(Bill.id == bill_id).first()
