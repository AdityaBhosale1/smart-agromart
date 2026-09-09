from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    category_id: int
    brand: Optional[str] = None
    composition: Optional[str] = None
    hsn_code: Optional[str] = None
    unit: str = "Kg"
    gst_percent: float = 5.0
    purchase_price: float
    selling_price: float
    min_stock_alert: int = 10
    status: str = "Active"

class ProductCreate(ProductBase):
    product_code: Optional[str] = None
    initial_stock: int = 0
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    composition: Optional[str] = None
    hsn_code: Optional[str] = None
    unit: Optional[str] = None
    gst_percent: Optional[float] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock_alert: Optional[int] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: int
    product_code: str
    total_stock: int
    created_at: datetime
    category_name: Optional[str] = None

    class Config:
        from_attributes = True
