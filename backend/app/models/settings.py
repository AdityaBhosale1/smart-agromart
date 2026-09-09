from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base

class AppSetting(Base):
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)
    group = Column(String, default="shop") # shop, billing, tax, notifications
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
