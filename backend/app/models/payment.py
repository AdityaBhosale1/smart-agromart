from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_number = Column(String, unique=True, index=True, nullable=False) # e.g. PAY-2026-00001
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    payment_type = Column(String, nullable=False) # FARMER_CREDIT_REPAYMENT, SUPPLIER_PAYMENT, BILL_PAYMENT
    amount = Column(Float, nullable=False)
    payment_method = Column(String, default="Cash") # Cash, UPI, Bank Transfer
    reference_number = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("Farmer")
    supplier = relationship("Supplier")
