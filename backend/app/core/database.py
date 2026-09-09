import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Ensure data directory exists
data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
os.makedirs(data_dir, exist_ok=True)

# For SQLite DB path resolution relative to backend folder
db_path = settings.DATABASE_URL
if db_path.startswith("sqlite:///./"):
    abs_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), db_path.replace("sqlite:///./", ""))
    db_path = f"sqlite:///{abs_db_path}"

engine = create_engine(
    db_path,
    connect_args={"check_same_thread": False} if "sqlite" in db_path else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
