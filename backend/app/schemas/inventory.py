from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBatchBase(BaseModel):
    product_id: int
    batch_number: str
    mfg_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    initial_quantity: int
    current_quantity: int
    purchase_price: float
    selling_price: float
    supplier_id: Optional[int] = None

class ProductBatchCreate(ProductBatchBase):
    pass

class ProductBatchResponse(ProductBatchBase):
    id: int
    product_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockMovementBase(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    movement_type: str # INWARD, OUTWARD, ADJUSTMENT, RETURN
    quantity: int
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementResponse(StockMovementBase):
    id: int
    product_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockAdjustmentRequest(BaseModel):
    product_id: int
    batch_id: Optional[int] = None
    adjustment_type: str # ADD, REDUCE
    quantity: int
    reason: str
