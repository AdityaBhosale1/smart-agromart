from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.product import Product, Category
from app.models.inventory import ProductBatch
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, CategoryResponse, CategoryCreate
from app.utils.invoice_numbers import generate_product_code

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(cat_in: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == cat_in.name).first()
    if existing:
        return existing
    cat = Category(name=cat_in.name, description=cat_in.description)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.get("", response_model=List[ProductResponse])
@router.get("/", response_model=List[ProductResponse])
def get_products(

    search: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    low_stock: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.like(s)) | (Product.brand.like(s)) | (Product.product_code.like(s)))
    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.order_by(Product.id.desc()).all()

    if low_stock:
        products = [p for p in products if p.total_stock <= p.min_stock_alert]

    res = []
    for p in products:
        p_res = ProductResponse.model_validate(p)
        p_res.category_name = p.category.name if p.category else "Unassigned"
        res.append(p_res)
    return res

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p_res = ProductResponse.model_validate(p)
    p_res.category_name = p.category.name if p.category else "Unassigned"
    return p_res

@router.post("", response_model=ProductResponse)
@router.post("/", response_model=ProductResponse)
def create_product(prod_in: ProductCreate, db: Session = Depends(get_db)):

    code = prod_in.product_code or generate_product_code(db)
    
    product = Product(
        product_code=code,
        name=prod_in.name,
        category_id=prod_in.category_id,
        brand=prod_in.brand,
        composition=prod_in.composition,
        hsn_code=prod_in.hsn_code,
        unit=prod_in.unit,
        gst_percent=prod_in.gst_percent,
        purchase_price=prod_in.purchase_price,
        selling_price=prod_in.selling_price,
        min_stock_alert=prod_in.min_stock_alert,
        total_stock=prod_in.initial_stock,
        status=prod_in.status
    )
    db.add(product)
    db.flush()

    # If initial stock provided, create default batch
    if prod_in.initial_stock > 0:
        batch_num = prod_in.batch_number or f"BATCH-{code}-01"
        batch = ProductBatch(
            product_id=product.id,
            batch_number=batch_num,
            expiry_date=prod_in.expiry_date,
            initial_quantity=prod_in.initial_stock,
            current_quantity=prod_in.initial_stock,
            purchase_price=prod_in.purchase_price,
            selling_price=prod_in.selling_price
        )
        db.add(batch)

    db.commit()
    db.refresh(product)
    p_res = ProductResponse.model_validate(product)
    p_res.category_name = product.category.name if product.category else "Unassigned"
    return p_res

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, prod_in: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, val in prod_in.model_dump(exclude_unset=True).items():
        setattr(product, field, val)

    db.add(product)
    db.commit()
    db.refresh(product)
    p_res = ProductResponse.model_validate(product)
    p_res.category_name = product.category.name if product.category else "Unassigned"
    return p_res
