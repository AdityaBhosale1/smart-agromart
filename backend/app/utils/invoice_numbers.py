from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.bill import Bill
from app.models.purchase import Purchase
from app.models.farmer import Farmer
from app.models.supplier import Supplier
from app.models.payment import Payment
from app.models.product import Product

def generate_bill_invoice_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"AGM-{year}-"
    last_bill = db.query(Bill).filter(Bill.invoice_number.like(f"{prefix}%")).order_by(Bill.id.desc()).first()
    if last_bill:
        try:
            last_num = int(last_bill.invoice_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Bill.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:05d}"

def generate_purchase_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"PUR-{year}-"
    last_pur = db.query(Purchase).filter(Purchase.purchase_number.like(f"{prefix}%")).order_by(Purchase.id.desc()).first()
    if last_pur:
        try:
            last_num = int(last_pur.purchase_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Purchase.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:05d}"

def generate_farmer_code(db: Session) -> str:
    year = datetime.now().year
    prefix = f"FMR-{year}-"
    last_fmr = db.query(Farmer).filter(Farmer.farmer_code.like(f"{prefix}%")).order_by(Farmer.id.desc()).first()
    if last_fmr:
        try:
            last_num = int(last_fmr.farmer_code.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Farmer.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:05d}"

def generate_supplier_code(db: Session) -> str:
    year = datetime.now().year
    prefix = f"SUP-{year}-"
    last_sup = db.query(Supplier).filter(Supplier.supplier_code.like(f"{prefix}%")).order_by(Supplier.id.desc()).first()
    if last_sup:
        try:
            last_num = int(last_sup.supplier_code.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Supplier.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:05d}"

def generate_payment_number(db: Session) -> str:
    year = datetime.now().year
    prefix = f"PAY-{year}-"
    last_pay = db.query(Payment).filter(Payment.payment_number.like(f"{prefix}%")).order_by(Payment.id.desc()).first()
    if last_pay:
        try:
            last_num = int(last_pay.payment_number.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Payment.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:05d}"

def generate_product_code(db: Session) -> str:
    prefix = "PRD-"
    last_prod = db.query(Product).filter(Product.product_code.like(f"{prefix}%")).order_by(Product.id.desc()).first()
    if last_prod:
        try:
            last_num = int(last_prod.product_code.split("-")[-1])
            new_num = last_num + 1
        except Exception:
            new_num = db.query(func.count(Product.id)).scalar() + 1
    else:
        new_num = 1
    return f"{prefix}{new_num:04d}"
