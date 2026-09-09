from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_code = Column(String, unique=True, index=True, nullable=False) # e.g. SUP-2026-00001
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    email = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    address = Column(String, nullable=True)
    total_purchases = Column(Float, default=0.0)
    pending_payment = Column(Float, default=0.0)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
