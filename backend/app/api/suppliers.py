from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.utils.invoice_numbers import generate_supplier_code

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[SupplierResponse])
def get_suppliers(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Supplier)
    if search:
        s = f"%{search}%"
        query = query.filter((Supplier.name.like(s)) | (Supplier.company_name.like(s)) | (Supplier.mobile.like(s)))
    return query.order_by(Supplier.id.desc()).all()

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    sup = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return sup

@router.post("/", response_model=SupplierResponse)
def create_supplier(supplier_in: SupplierCreate, db: Session = Depends(get_db)):
    code = supplier_in.supplier_code or generate_supplier_code(db)
    supplier = Supplier(
        supplier_code=code,
        name=supplier_in.name,
        company_name=supplier_in.company_name,
        mobile=supplier_in.mobile,
        email=supplier_in.email,
        gstin=supplier_in.gstin,
        address=supplier_in.address,
        status=supplier_in.status
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier_in: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, val in supplier_in.model_dump(exclude_unset=True).items():
        setattr(supplier, field, val)

    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier
