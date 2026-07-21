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
    category = Column(String(50))
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) 
    email = Column(String(150), unique=True, index=True, nullable=False) 
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.OPERATOR, nullable=False) 
    is_active = Column(Boolean, default=True, nullable=False) 
    requires_password_change = Column(Boolean, default=True, nullable=False) # Flag for mandatory first login
    
class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) 
    quantity = Column(Integer, nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Mapping the relationship with the products table
    product = relationship("Product")