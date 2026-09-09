from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart AgroMart API",
    description="AI-Powered Agricultural Shop Billing, Inventory & Farmer Management System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Smart AgroMart SaaS Platform",
        "features": ["Billing", "Inventory", "Farmers", "Digital Khata", "AI Forecasting"]
    }

@app.get("/api/dashboard/kpis")
def get_dashboard_kpis():
    return [
        {"id": "sales", "title": "Today's Sales", "value": "₹24,560", "change": "+12%"},
        {"id": "profit", "title": "Profit", "value": "₹6,320", "change": "+18%"},
        {"id": "bills", "title": "Bills Generated", "value": "48", "change": "+7%"},
        {"id": "credit", "title": "Pending Credit", "value": "₹12,400", "change": "-5%"},
        {"id": "stock", "title": "Low Stock Products", "value": "6", "change": "+2"},
        {"id": "farmers", "title": "Total Farmers", "value": "156", "change": "+11%"},
    ]
