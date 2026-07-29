from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas
from app.database import get_db
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[schemas.CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    return CategoryService.get_all_categories(db)

@router.post("", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    return CategoryService.create_category(db, category)