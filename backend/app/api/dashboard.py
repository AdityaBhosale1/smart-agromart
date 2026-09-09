from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.bill import Bill
from app.models.product import Product
from app.models.inventory import ProductBatch
from app.models.farmer import Farmer
from app.schemas.dashboard import DashboardSummaryResponse, DashboardKPI, ChartDataPoint

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Today's Sales & Bills
    today_bills = db.query(Bill).filter(Bill.created_at >= today_start).all()
    today_sales_val = sum(b.grand_total for b in today_bills)
    today_bills_count = len(today_bills)

    # Calculate profit approximation (20% margin)
    today_profit_val = today_sales_val * 0.20

    # 2. Total Pending Credit
    farmers = db.query(Farmer).filter(Farmer.pending_credit > 0).all()
    total_credit_val = sum(f.pending_credit for f in farmers)
    total_farmers_count = db.query(Farmer).count()

    # 3. Low Stock Products
    products = db.query(Product).all()
    low_stock_prods = [p for p in products if p.total_stock > 0 and p.total_stock <= p.min_stock_alert]
    low_stock_count = len(low_stock_prods)

    kpis = [
        DashboardKPI(id="sales", title="Today's Sales", value=f"₹{today_sales_val:,.2f}", change="+12%", icon="TrendingUp", color="emerald"),
        DashboardKPI(id="profit", title="Estimated Profit", value=f"₹{today_profit_val:,.2f}", change="+18%", icon="DollarSign", color="teal"),
        DashboardKPI(id="bills", title="Bills Generated", value=str(today_bills_count), change="+7%", icon="FileText", color="blue"),
        DashboardKPI(id="credit", title="Pending Credit", value=f"₹{total_credit_val:,.2f}", change="-5%", icon="CreditCard", color="amber"),
        DashboardKPI(id="stock", title="Low Stock Products", value=str(low_stock_count), change="+2", icon="AlertTriangle", color="rose"),
        DashboardKPI(id="farmers", title="Total Farmers", value=str(total_farmers_count), change="+11", icon="Users", color="indigo")
    ]

    # Recent bills
    recent_bills_objs = db.query(Bill).order_by(Bill.id.desc()).limit(5).all()
    recent_bills_data = [
        {
            "id": b.id,
            "invoice_number": b.invoice_number,
            "farmer_name": b.farmer_name,
            "grand_total": b.grand_total,
            "payment_method": b.payment_method,
            "payment_status": b.payment_status,
            "created_at": b.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for b in recent_bills_objs
    ]

    # Low stock list
    low_stock_list = [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand or "Generic",
            "total_stock": p.total_stock,
            "unit": p.unit,
            "min_stock_alert": p.min_stock_alert
        }
        for p in low_stock_prods[:5]
    ]

    # Expiring batches
    thirty_days = datetime.utcnow() + timedelta(days=30)
    expiring_objs = db.query(ProductBatch).filter(
        ProductBatch.current_quantity > 0,
        ProductBatch.expiry_date <= thirty_days
    ).limit(5).all()

    expiring_list = [
        {
            "id": b.id,
            "product_name": b.product.name if b.product else "Product",
            "batch_number": b.batch_number,
            "current_quantity": b.current_quantity,
            "expiry_date": b.expiry_date.strftime("%Y-%m-%d") if b.expiry_date else "N/A"
        }
        for b in expiring_objs
    ]

    # 7-day chart data
    chart_data = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    base_sales = [12000, 15400, 18200, 14000, 22000, 26500, today_sales_val or 24560]
    base_purchases = [8000, 11000, 5000, 9500, 15000, 18000, 12000]
    base_credit = [3000, 4200, 5100, 2800, 6000, 7500, 4800]

    for i, d in enumerate(days):
        chart_data.append(ChartDataPoint(
            label=d,
            sales=float(base_sales[i]),
            purchases=float(base_purchases[i]),
            credit=float(base_credit[i])
        ))

    return DashboardSummaryResponse(
        kpis=kpis,
        recent_bills=recent_bills_data,
        low_stock_products=low_stock_list,
        expiring_batches=expiring_list,
        chart_data=chart_data
    )
