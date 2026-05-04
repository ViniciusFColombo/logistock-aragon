from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

# PRODUCTS

class ProductBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, json_schema_extra={"examples": ["Monitor LG 24'"]})
    sku: str = Field(..., json_schema_extra={"examples": ["MON-LG-24"]})
    category: Optional[str] = Field(None, json_schema_extra={"examples": ["Electronics"]})
    price: float = Field(..., gt=0, json_schema_extra={"examples": [150.50]})
    stock_quantity: int = Field(default=0, ge=0, json_schema_extra={"examples": [10]})

class ProductCreate(ProductBase): # POST product
    pass

class ProductUpdate(BaseModel): # PUT product
    name: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# USERS

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# OTHERS

class Token(BaseModel):
    access_token: str
    token_type: str

class DashboardSummary(BaseModel):
    total_products: int
    total_stock_items: int
    total_inventory_value: float
    low_stock_count: int