from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    brand = Column(String, nullable=True)
    composition = Column(String, nullable=True) # Technical active ingredient
    hsn_code = Column(String, nullable=True)
    unit = Column(String, default="Kg") # Kg, L, Bottle, Packet, Bag, Grams
    gst_percent = Column(Float, default=5.0) # 0, 5, 12, 18, 28
    purchase_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    min_stock_alert = Column(Integer, default=10)
    total_stock = Column(Integer, default=0)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    batches = relationship("ProductBatch", back_populates="product", cascade="all, delete-orphan")
