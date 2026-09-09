from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False) # e.g. AGM-2026-00001
    invoice_date = Column(DateTime, default=datetime.utcnow)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    farmer_name = Column(String, nullable=False, default="Walk-in Customer")
    farmer_mobile = Column(String, nullable=True)
    subtotal = Column(Float, default=0.0)
    taxable_amount = Column(Float, default=0.0)
    gst_amount = Column(Float, default=0.0)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    discount_amount = Column(Float, default=0.0)
    grand_total = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    pending_amount = Column(Float, default=0.0)
    payment_method = Column(String, default="Cash") # Cash, UPI, Credit, Split, Bank Transfer
    payment_status = Column(String, default="Paid") # Paid, Partial, Credit
    due_date = Column(DateTime, nullable=True)
    notes = Column(String, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    created_by = relationship("User")

class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("product_batches.id"), nullable=True)
    product_name = Column(String, nullable=False)
    batch_number = Column(String, nullable=True)
    unit = Column(String, nullable=True, default="Bags")
    hsn_code = Column(String, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    rate = Column(Float, nullable=False, default=0.0)
    gst_percent = Column(Float, default=5.0)
    discount_amount = Column(Float, default=0.0)
    taxable_amount = Column(Float, nullable=False)
    gst_amount = Column(Float, nullable=False)
    cgst = Column(Float, default=0.0)
    sgst = Column(Float, default=0.0)
    igst = Column(Float, default=0.0)
    total_amount = Column(Float, nullable=False)

    bill = relationship("Bill", back_populates="items")
    product = relationship("Product")
    batch = relationship("ProductBatch")
