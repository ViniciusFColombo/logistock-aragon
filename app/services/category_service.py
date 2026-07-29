from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List
from app import schemas
from app.repositories.category_repo import CategoryRepository

class CategoryService:
    """
    Business logic layer for Category operations.
    """

    @staticmethod
    def get_all_categories(db: Session) -> List[schemas.CategoryResponse]:
        return CategoryRepository.get_all(db)

    @staticmethod
    def create_category(db: Session, category_data: schemas.CategoryCreate) -> schemas.CategoryResponse:
        # Check if category already exists (case-insensitive)
        existing = CategoryRepository.get_by_name(db, category_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{category_data.name}' already exists."
            )
        
        try:
            return CategoryRepository.create(db, category_data)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An error occurred while creating the category."
            )