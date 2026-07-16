from pydantic import BaseModel, Field, ConfigDict, StringConstraints, EmailStr
from typing import Annotated, Optional
from datetime import datetime
from .constants import MovementType
from .models import UserRole 

# ==========================================
# PRODUCTS
# ==========================================

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, json_schema_extra={"examples": ["Monitor LG 24'"]})
    sku: str = Field(..., json_schema_extra={"examples": ["MON-LG-24"]})
    category: Optional[str] = Field(None, json_schema_extra={"examples": ["Electronics"]})
    price: float = Field(..., gt=0, json_schema_extra={"examples": [150.50]})
    stock_quantity: int = Field(default=0, ge=0, json_schema_extra={"examples": [10]})

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# USERS
# ==========================================

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"examples": ["Vinícius Aragón"]})
    email: EmailStr = Field(..., json_schema_extra={"examples": ["vinicius@logistock.com"]})
    role: UserRole = Field(default=UserRole.OPERATOR)

# Schema used by the Admin within the Dashboard to create new employees
class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Default temporary user password")

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int
    is_active: bool
    requires_password_change: bool
    
    model_config = ConfigDict(from_attributes=True)

# ==========================================
# STOCK MOVEMENTS 
# ==========================================

class StockMovementCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0, description="The quantity must be greater than zero.")
    movement_type: MovementType

class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    user_id: int 
    quantity: int
    movement_type: MovementType
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# OTHERS & AGENT
# ==========================================

class Token(BaseModel):
    access_token: str
    token_type: str

class DashboardSummary(BaseModel):
    total_products: int
    total_stock_items: int
    total_inventory_value: float
    low_stock_count: int
    inputs_month: int
    outputs_month: int
    estimated_revenue: float

    class Config:
        from_attributes = True

class AgentQueryRequest(BaseModel):
    query: Annotated[
        str, 
        StringConstraints(strip_whitespace=True, min_length=3, max_length=250)
    ] = Field(
        ...,
        description="The question or prompt sent by the user to the AI logistics agent."
    )