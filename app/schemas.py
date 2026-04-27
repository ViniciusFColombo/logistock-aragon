from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class ProductCreate(BaseModel):
    name: str = Field(..., json_schema_extra={"examples": ["Monitor LG 24'"]})
    sku: str = Field(..., json_schema_extra={"examples": ["MON-LG-24"]})
    category: Optional[str] = Field(None, json_schema_extra={"examples": ["Electronics"]})
    price: float = Field(..., gt=0, json_schema_extra={"examples": [150.50]})
    stock_quantity: int = Field(default=0, ge=0, json_schema_extra={"examples": [10]})

class ProductResponse(ProductCreate):
    id: int
    created_at: datetime
    updated_at: datetime 

model_config = ConfigDict(from_attributes=True)

class DashboardSummary(BaseModel):
    total_products: int
    total_stock_items: int
    total_inventory_value: float
    low_stock_count: int

class UserCreate(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str