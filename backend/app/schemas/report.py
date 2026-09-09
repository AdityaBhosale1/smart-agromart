from pydantic import BaseModel
from typing import List, Optional, Dict

class SalesReportSummary(BaseModel):
    total_sales: float
    total_bills: int
    total_gst: float
    cash_sales: float
    credit_sales: float
    upi_sales: float

class GSTReportSummary(BaseModel):
    total_taxable_value: float
    total_cgst: float
    total_sgst: float
    total_igst: float
    total_gst_collected: float
    gst_by_rate: Dict[str, float]

class InventoryReportSummary(BaseModel):
    total_products: int
    total_stock_value: float
    low_stock_count: int
    out_of_stock_count: int
    expiring_soon_count: int

class CreditReportSummary(BaseModel):
    total_outstanding_credit: float
    total_farmers_with_credit: int
    overdue_count: int
