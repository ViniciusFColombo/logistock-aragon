from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Pega a URL diretamente do ambiente
DATABASE_URL = os.getenv("DATABASE_URL")

if os.path.exists("/.dockerenv") and DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("localhost", "db")

# O pool_pre_ping ajuda a evitar erros de conexão perdida
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()