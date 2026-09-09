from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.core.database import Base

class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    farmer_code = Column(String, unique=True, index=True, nullable=False) # e.g. FMR-2026-00001
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=False, index=True)
    village = Column(String, nullable=True)
    district = Column(String, nullable=True)
    land_acreage = Column(Float, default=0.0)
    primary_crop = Column(String, nullable=True)
    pending_credit = Column(Float, default=0.0)
    credit_limit = Column(Float, default=50000.0)
    status = Column(String, default="Active") # Active, Inactive
    created_at = Column(DateTime, default=datetime.utcnow)
