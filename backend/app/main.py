import sys
import os
from datetime import datetime, timedelta
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Add project root directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal, get_db
from app.core.security import get_password_hash
from app.api import api_router

import app.models # Register all models

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Agricultural Shop Billing, Inventory & Farmer Management System API"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

def seed_initial_data():
    """
    Idempotent database seeder for admin user, categories, products, batches, farmers, suppliers, purchases, notifications, and settings.
    """
    db = SessionLocal()
    try:
        from app.models.user import User
        from app.models.product import Category, Product
        from app.models.inventory import ProductBatch, StockMovement
        from app.models.farmer import Farmer
        from app.models.supplier import Supplier
        from app.models.purchase import Purchase, PurchaseItem
        from app.models.bill import Bill, BillItem
        from app.models.credit import CreditTransaction
        from app.models.notification import Notification
        from app.models.settings import AppSetting

        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@smartagromart.com").first()
        if not admin:
            admin = User(
                name="AgroMart Admin",
                email="admin@smartagromart.com",
                hashed_password=get_password_hash("admin123"),
                role="Admin",
                is_active=True
            )
            db.add(admin)

        # 2. Categories
        categories_data = [
            ("Fertilizers", "Chemical and organic fertilizers for crops"),
            ("Seeds", "High yield hybrid and certified crop seeds"),
            ("Pesticides", "Insecticides, pesticides and crop protection chemicals"),
            ("Fungicides", "Fungal disease protection chemicals"),
            ("Equipment", "Agricultural tools, sprayers and machinery parts")
        ]
        cat_map = {}
        for c_name, c_desc in categories_data:
            cat = db.query(Category).filter(Category.name == c_name).first()
            if not cat:
                cat = Category(name=c_name, description=c_desc)
                db.add(cat)
                db.flush()
            cat_map[c_name] = cat.id

        # 3. Products & Batches
        products_seed = [
            ("PRD-0001", "Urea 45% Nitrogen (50kg Bag)", "Fertilizers", "IFFCO", "45% Nitrogen", "3102", "Bag", 5.0, 260.0, 300.0, 15, 84),
            ("PRD-0002", "DAP 18-46-0 (50kg Bag)", "Fertilizers", "IPL", "Di-Ammonium Phosphate", "3105", "Bag", 5.0, 1200.0, 1350.0, 10, 42),
            ("PRD-0003", "NPK 19-19-19 Water Soluble (1kg)", "Fertilizers", "Mahadhan", "19:19:19 Complex", "3105", "Packet", 5.0, 110.0, 145.0, 20, 60),
            ("PRD-0004", "Hybrid Wheat Seed HD-2967 (40kg)", "Seeds", "Mahyco", "High Yield Wheat Seed", "1209", "Bag", 5.0, 1400.0, 1650.0, 12, 38),
            ("PRD-0005", "Cotton Seed Hybrid RCH-659 (475g)", "Seeds", "Rasi Seeds", "Bollgard II Hybrid Cotton", "1209", "Packet", 5.0, 720.0, 853.0, 25, 76),
            ("PRD-0006", "Coragen Insecticide (150ml)", "Pesticides", "FMC", "Chlorantraniliprole 18.5% SC", "3808", "Bottle", 18.0, 1550.0, 1820.0, 8, 30),
            ("PRD-0007", "Confidor Insecticide (250ml)", "Pesticides", "Bayer", "Imidacloprid 17.8% SL", "3808", "Bottle", 18.0, 420.0, 510.0, 10, 32),
            ("PRD-0008", "Saaf Fungicide (500g)", "Fungicides", "UPL", "Carbendazim 12% + Mancozeb 63%", "3808", "Packet", 18.0, 310.0, 380.0, 15, 45),
            ("PRD-0009", "Knapsack Battery Sprayer 16L", "Equipment", "Neptune", "12V 8Ah Battery Sprayer", "8424", "Units", 12.0, 2100.0, 2650.0, 5, 12)
        ]

        now = datetime.utcnow()
        for p_code, p_name, c_name, p_brand, p_comp, hsn, p_unit, gst, p_price, s_price, min_alert, init_stock in products_seed:
            prod = db.query(Product).filter(Product.product_code == p_code).first()
            if not prod:
                prod = Product(
                    product_code=p_code,
                    name=p_name,
                    category_id=cat_map[c_name],
                    brand=p_brand,
                    composition=p_comp,
                    hsn_code=hsn,
                    unit=p_unit,
                    gst_percent=gst,
                    purchase_price=p_price,
                    selling_price=s_price,
                    min_stock_alert=min_alert,
                    total_stock=init_stock
                )
                db.add(prod)
                db.flush()

                # Add sample batches for FEFO demonstration (including an expired batch)
                b1_qty = int(init_stock / 2)
                b2_qty = init_stock - b1_qty

                b1 = ProductBatch(
                    product_id=prod.id,
                    batch_number=f"BCH-{p_code}-2026-A",
                    expiry_date=now + timedelta(days=45),
                    initial_quantity=b1_qty,
                    current_quantity=b1_qty,
                    purchase_price=p_price,
                    selling_price=s_price
                )
                b2 = ProductBatch(
                    product_id=prod.id,
                    batch_number=f"BCH-{p_code}-2026-B",
                    expiry_date=now + timedelta(days=240),
                    initial_quantity=b2_qty,
                    current_quantity=b2_qty,
                    purchase_price=p_price,
                    selling_price=s_price
                )
                # Expired batch to verify FEFO non-allocation of expired stock
                b_exp = ProductBatch(
                    product_id=prod.id,
                    batch_number=f"BCH-{p_code}-EXP",
                    expiry_date=now - timedelta(days=30),
                    initial_quantity=5,
                    current_quantity=5,
                    purchase_price=p_price,
                    selling_price=s_price
                )
                db.add(b1)
                db.add(b2)
                db.add(b_exp)
                db.flush()

                from app.services.inventory_service import update_product_total_stock
                update_product_total_stock(db, prod.id)

        # 4. Farmers
        farmers_seed = [
            ("FMR-2026-00001", "Ramesh Kumar Patel", "9876543210", "Solapur", "Solapur", 12.5, "Wheat", 12400.0, 50000.0),
            ("FMR-2026-00002", "Suresh Tukaram Shinde", "9823456789", "Mohol", "Solapur", 8.0, "Cotton", 4500.0, 30000.0),
            ("FMR-2026-00003", "Ananda Rao Jadhav", "9765432109", "Pandharpur", "Solapur", 15.0, "Sugarcane", 0.0, 75000.0),
            ("FMR-2026-00004", "Vijay Gopal Pawar", "9988776655", "Barshi", "Solapur", 5.5, "Soybean", 8200.0, 25000.0),
            ("FMR-2026-00005", "Ganesh Vitthal Kulkarni", "9123456780", "Sangola", "Solapur", 20.0, "Pomegranate", 18500.0, 100000.0)
        ]
        for f_code, name, mob, vill, dist, acre, crop, cred, lim in farmers_seed:
            f = db.query(Farmer).filter(Farmer.farmer_code == f_code).first()
            if not f:
                f = Farmer(
                    farmer_code=f_code,
                    name=name,
                    mobile=mob,
                    village=vill,
                    district=dist,
                    land_acreage=acre,
                    primary_crop=crop,
                    pending_credit=cred,
                    credit_limit=lim
                )
                db.add(f)

        # 5. Suppliers
        suppliers_seed = [
            ("SUP-2026-00001", "Kailash Agro Agency", "IFFCO India Ltd", "9844001122", "info@iffco.in", "27AAACI1234F1Z1", "MIDC Area, Solapur", 248600.0, 18500.0),
            ("SUP-2026-00002", "Mahyco Seeds Distributor", "Maharashtra Hybrid Seeds Co", "9844003344", "contact@mahyco.com", "27AAACM5678F1Z2", "Mondha Market, Jalna", 125000.0, 0.0),
            ("SUP-2026-00003", "Bayer CropScience Pvt Ltd", "Bayer India", "9844005566", "sales@bayer.co.in", "27AAACB9012F1Z3", "Bandra East, Mumbai", 182000.0, 24000.0)
        ]
        for s_code, s_name, c_name, mob, email, gstin, addr, total_pur, pend_pay in suppliers_seed:
            sup = db.query(Supplier).filter(Supplier.supplier_code == s_code).first()
            if not sup:
                sup = Supplier(
                    supplier_code=s_code,
                    name=s_name,
                    company_name=c_name,
                    mobile=mob,
                    email=email,
                    gstin=gstin,
                    address=addr,
                    total_purchases=total_pur,
                    pending_payment=pend_pay
                )
                db.add(sup)

        # 6. Notifications
        notifs_seed = [
            ("Low Stock Warning: Coragen Insecticide", "Coragen Insecticide current stock (30 bottles) is below critical threshold. Reorder recommended.", "STOCK", "warning"),
            ("Batch Expiry Alert: Urea 45%", "Batch BCH-PRD-0001-2026-A expires in 45 days. Prioritize FEFO billing.", "EXPIRY", "critical"),
            ("Overdue Credit Reminder: Ramesh Patel", "Ramesh Kumar Patel has outstanding credit of ₹12,400 pending since 25 days.", "CREDIT", "info")
        ]
        for title, msg, cat, sev in notifs_seed:
            n = db.query(Notification).filter(Notification.title == title).first()
            if not n:
                n = Notification(title=title, message=msg, category=cat, severity=sev)
                db.add(n)

        # 7. App Settings
        settings_seed = {
            "shop_name": "Smart AgroMart",
            "tagline": "AI-Powered Agricultural Shop Billing & Inventory System",
            "mobile": "+91 98765 43210",
            "gstin": "27AAACG1234F1Z5",
            "address": "Main Market Road, Krishi Mandi, Solapur, Maharashtra - 413001",
            "currency_symbol": "₹",
            "invoice_prefix": "AGM",
            "enable_fefo": "true",
            "low_stock_threshold": "10",
            "enable_sms_alerts": "true"
        }
        for k, v in settings_seed.items():
            s = db.query(AppSetting).filter(AppSetting.key == k).first()
            if not s:
                s = AppSetting(key=k, value=v)
                db.add(s)

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding initial data: {e}")
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    seed_initial_data()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Smart AgroMart SaaS Platform",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "features": [
            "FEFO Inventory Allocation",
            "Transactional Billing & Invoicing",
            "Digital Khata Credit Ledger",
            "Stock Inward Purchases",
            "AI Sales Forecasting & Crop Advice",
            "GST & Analytics Reports"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
