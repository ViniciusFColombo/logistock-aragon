from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from datetime import datetime, timezone
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from .constants import MovementType
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    OPERATOR = "operator"

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    
    # Foreign Key pointing to categories table instead of plain string
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationship to eager load Category object
    category_rel = relationship("Category", back_populates="products")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) 
    email = Column(String(150), unique=True, index=True, nullable=False) 
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False) 
    is_active = Column(Boolean, default=True, nullable=False) 
    requires_password_change = Column(Boolean, default=True, nullable=False)


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    quantity = Column(Integer, nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")

# ==========================================
# NEW TABLES FOR ARCHITECTURE EXPANSION
# ==========================================

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to navigate back to products from a category
    products = relationship("Product", back_populates="category_rel")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    month_year = Column(String(7), nullable=False)  # Format: "YYYY-MM" (e.g. "2026-07")
    total_inputs = Column(Integer, default=0, nullable=False)
    total_outputs = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())