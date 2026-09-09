from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional

from app.core.database import get_db
from app.schemas.report import SalesReportSummary, GSTReportSummary, InventoryReportSummary, CreditReportSummary
from app.services.report_service import get_sales_report, get_gst_report, get_inventory_report, get_credit_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/sales", response_model=SalesReportSummary)
def sales_report(range: Optional[str] = Query("month"), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start_date = None
    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0)
    elif range == "week":
        start_date = now - timedelta(days=7)
    elif range == "month":
        start_date = now - timedelta(days=30)
    elif range == "year":
        start_date = now - timedelta(days=365)

    return get_sales_report(db, start_date=start_date)

@router.get("/gst", response_model=GSTReportSummary)
def gst_report(range: Optional[str] = Query("month"), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start_date = None
    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0)
    elif range == "month":
        start_date = now - timedelta(days=30)

    return get_gst_report(db, start_date=start_date)

@router.get("/inventory", response_model=InventoryReportSummary)
def inventory_report(db: Session = Depends(get_db)):
    return get_inventory_report(db)

@router.get("/credit", response_model=CreditReportSummary)
def credit_report(db: Session = Depends(get_db)):
    return get_credit_report(db)
