from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.models.bill import Bill, BillItem
from app.models.product import Product
from app.models.inventory import ProductBatch
from app.models.farmer import Farmer
from app.schemas.report import SalesReportSummary, GSTReportSummary, InventoryReportSummary, CreditReportSummary

def get_sales_report(db: Session, start_date: datetime = None, end_date: datetime = None) -> SalesReportSummary:
    query = db.query(Bill)
    if start_date:
        query = query.filter(Bill.created_at >= start_date)
    if end_date:
        query = query.filter(Bill.created_at <= end_date)

    bills = query.all()
    total_sales = sum(b.grand_total for b in bills)
    total_gst = sum(b.gst_amount for b in bills)
    total_bills = len(bills)

    cash_sales = sum(b.grand_total for b in bills if b.payment_method == "Cash")
    credit_sales = sum(b.pending_amount for b in bills if b.pending_amount > 0)
    upi_sales = sum(b.grand_total for b in bills if b.payment_method in ["UPI", "Bank Transfer"])

    return SalesReportSummary(
        total_sales=round(total_sales, 2),
        total_bills=total_bills,
        total_gst=round(total_gst, 2),
        cash_sales=round(cash_sales, 2),
        credit_sales=round(credit_sales, 2),
        upi_sales=round(upi_sales, 2)
    )

def get_gst_report(db: Session, start_date: datetime = None, end_date: datetime = None) -> GSTReportSummary:
    query = db.query(BillItem).join(Bill)
    if start_date:
        query = query.filter(Bill.created_at >= start_date)
    if end_date:
        query = query.filter(Bill.created_at <= end_date)

    items = query.all()
    taxable_val = sum(i.taxable_amount for i in items)
    total_gst = sum(i.gst_amount for i in items)

    # Standard CGST & SGST equal split for intra-state sales
    cgst = total_gst / 2.0
    sgst = total_gst / 2.0
    igst = 0.0

    gst_by_rate = {}
    for i in items:
        rate_str = f"{i.gst_percent}%"
        gst_by_rate[rate_str] = gst_by_rate.get(rate_str, 0.0) + i.gst_amount

    return GSTReportSummary(
        total_taxable_value=round(taxable_val, 2),
        total_cgst=round(cgst, 2),
        total_sgst=round(sgst, 2),
        total_igst=round(igst, 2),
        total_gst_collected=round(total_gst, 2),
        gst_by_rate={k: round(v, 2) for k, v in gst_by_rate.items()}
    )

def get_inventory_report(db: Session) -> InventoryReportSummary:
    products = db.query(Product).all()
    total_prods = len(products)

    batches = db.query(ProductBatch).filter(ProductBatch.current_quantity > 0).all()
    total_val = sum(b.current_quantity * b.purchase_price for b in batches)

    low_stock = sum(1 for p in products if p.total_stock > 0 and p.total_stock <= p.min_stock_alert)
    out_of_stock = sum(1 for p in products if p.total_stock == 0)

    now = datetime.utcnow()
    thirty_days = now + timedelta(days=30)
    expiring = db.query(ProductBatch).filter(
        ProductBatch.current_quantity > 0,
        ProductBatch.expiry_date <= thirty_days,
        ProductBatch.expiry_date >= now
    ).count()

    return InventoryReportSummary(
        total_products=total_prods,
        total_stock_value=round(total_val, 2),
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
        expiring_soon_count=expiring
    )

def get_credit_report(db: Session) -> CreditReportSummary:
    farmers = db.query(Farmer).filter(Farmer.pending_credit > 0).all()
    total_credit = sum(f.pending_credit for f in farmers)
    return CreditReportSummary(
        total_outstanding_credit=round(total_credit, 2),
        total_farmers_with_credit=len(farmers),
        overdue_count=sum(1 for f in farmers if f.pending_credit > 10000)
    )
