from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.farmer import Farmer
from app.schemas.farmer import FarmerCreate, FarmerUpdate, FarmerResponse
from app.utils.invoice_numbers import generate_farmer_code

router = APIRouter(prefix="/farmers", tags=["Farmers"])

@router.get("", response_model=List[FarmerResponse])
@router.get("/", response_model=List[FarmerResponse])
def get_farmers(
    search: Optional[str] = Query(None),
    village: Optional[str] = Query(None),
    has_credit: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Farmer)
    if search:
        s = f"%{search}%"
        query = query.filter((Farmer.name.like(s)) | (Farmer.mobile.like(s)) | (Farmer.farmer_code.like(s)))
    if village:
        query = query.filter(Farmer.village == village)
    if has_credit:
        query = query.filter(Farmer.pending_credit > 0)

    farmers = query.order_by(Farmer.id.desc()).all()
    return farmers

@router.get("/{farmer_id}", response_model=FarmerResponse)
def get_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    return farmer

@router.post("", response_model=FarmerResponse)
@router.post("/", response_model=FarmerResponse)
def create_farmer(farmer_in: FarmerCreate, db: Session = Depends(get_db)):
    if farmer_in.mobile:
        existing = db.query(Farmer).filter(Farmer.mobile == farmer_in.mobile).first()
        if existing:
            raise HTTPException(status_code=409, detail="A farmer with this mobile number already exists.")

    code = farmer_in.farmer_code or generate_farmer_code(db)
    farmer = Farmer(
        farmer_code=code,
        name=farmer_in.name,
        mobile=farmer_in.mobile,
        village=farmer_in.village,
        district=farmer_in.district,
        land_acreage=farmer_in.land_acreage,
        primary_crop=farmer_in.primary_crop,
        pending_credit=farmer_in.pending_credit,
        credit_limit=farmer_in.credit_limit,
        status=farmer_in.status
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer

@router.put("/{farmer_id}", response_model=FarmerResponse)
def update_farmer(farmer_id: int, farmer_in: FarmerUpdate, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")

    if farmer_in.mobile and farmer_in.mobile != farmer.mobile:
        existing = db.query(Farmer).filter(Farmer.mobile == farmer_in.mobile, Farmer.id != farmer_id).first()
        if existing:
            raise HTTPException(status_code=409, detail="A farmer with this mobile number already exists.")

    for field, val in farmer_in.model_dump(exclude_unset=True).items():
        setattr(farmer, field, val)

    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    return farmer

@router.delete("/{farmer_id}")
def delete_farmer(farmer_id: int, db: Session = Depends(get_db)):
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    db.delete(farmer)
    db.commit()
    return {"message": "Farmer deleted successfully"}
