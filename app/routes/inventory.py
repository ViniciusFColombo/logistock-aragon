from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
from .auth import get_current_user

router = APIRouter(prefix="/products", tags=["Products Management"])


@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), token: str = Depends(get_current_user)):
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registred")
    
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.get("/", response_model=List[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return products

@router.get("/low-stock", response_model=List[schemas.ProductResponse])
def get_low_stock(threshold: int = 5, db: Session = Depends(get_db)):
    """
    Returns products where the quantity in stock is less than or equal to the threshold.
    The default is 5 units, but it can be changed in query string.
    """

    products = db.query(models.Product).filter(models.Product.stock_quantity <= threshold).all()
    return products

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.query(models.Product).count()
    total_stock_items = db.query(func.sum(models.Product.stock_quantity)).scalar() or 0
    total_inventory_value = db.query(func.sum(models.Product.price * models.Product.stock_quantity)).scalar() or 0
    low_stock_count = db.query(models.Product).filter(models.Product.stock_quantity <= 5).count()

    return {
        "total_products": total_products,
        "total_stock_items": total_stock_items,
        "total_inventory_value": round(total_inventory_value, 2),
        "low_stock_count": low_stock_count
    }

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(product_id: int, product_data: schemas.ProductCreate, db: Session = Depends(get_db), token: str = Depends(get_current_user)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.model_dump()
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), token: str = Depends(get_current_user)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not db_product:
        raise HTTPException(status_code=400, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return None