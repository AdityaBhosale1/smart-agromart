from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse, NotificationCreate

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    category: Optional[str] = Query(None),
    unread_only: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Notification)
    if category:
        query = query.filter(Notification.category == category)
    if unread_only:
        query = query.filter(Notification.is_read == False)

    return query.order_by(Notification.id.desc()).all()

@router.post("/", response_model=NotificationResponse)
def create_notification(notif_in: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(
        title=notif_in.title,
        message=notif_in.message,
        category=notif_in.category,
        severity=notif_in.severity,
        action_url=notif_in.action_url
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif

@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}

@router.put("/{notif_id}/read")
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}
