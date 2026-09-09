from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationCreate(BaseModel):
    title: str
    message: str
    category: str = "STOCK"
    severity: str = "warning"
    action_url: Optional[str] = None

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    category: str
    severity: str
    is_read: bool
    action_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
