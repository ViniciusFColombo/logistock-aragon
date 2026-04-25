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