from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .database import engine, get_db
from . import models, schemas

models.Base.metadata.create_all(bind=engine)

app= FastAPI(title="LogiStock Aragón - LogiStock Aragón - Inventory Management")

@app.get("/")
def home():
    return {"message": "Welcome to LogiStock Aragón Management System"}

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registred")
    
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductResponse])
def list_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).all()
    return products

@app.get("/products/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product