from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.services.inventory_service import InventoryService
from app.routes.auth import get_current_user, get_current_admin 

router = APIRouter(prefix="/products", tags=["Products Management"])

@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return InventoryService.create_product(db, product)

@router.get("/", response_model=List[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db), skip: int = 0, limit: int = 10, search: Optional[str] = None):
    return InventoryService.list_products(db, skip, limit, search)

@router.get("/low-stock", response_model=List[schemas.ProductResponse])
def get_low_stock(threshold: int = 5, db: Session = Depends(get_db)):
    return InventoryService.get_low_stock(db, threshold)

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    return InventoryService.get_dashboard_summary(db)

@router.get("/stock-runway", response_model=List[dict])
def get_stock_runway_prediction(db: Session = Depends(get_db)):
    return InventoryService.get_stock_runway_prediction(db)

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return InventoryService.get_product_by_id(db, product_id)

@router.get("/sku/{sku_code}", response_model=schemas.ProductResponse)
def get_product_by_sku(sku_code: str, db: Session = Depends(get_db)):
    return InventoryService.get_product_by_sku(db, sku_code)

@router.post("/transaction", response_model=schemas.StockMovementResponse)
def create_stock_transaction(transaction: schemas.StockMovementCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return InventoryService.create_stock_transaction(db, transaction, user_id=current_user.id)

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_data: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return InventoryService.update_product(db, product_id, product_data)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin)):
    InventoryService.delete_product(db, product_id)
    return None