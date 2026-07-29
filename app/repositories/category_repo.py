from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas

class CategoryRepository:
    """
    Isolated data access layer for Categories.
    Ensures data consistency and ACID principles via transaction management.
    """

    @staticmethod
    def get_all(db: Session) -> List[models.Category]:
        return db.query(models.Category).order_by(models.Category.name.asc()).all()

    @staticmethod
    def get_by_id(db: Session, category_id: int) -> Optional[models.Category]:
        return db.query(models.Category).filter(models.Category.id == category_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[models.Category]:
        return db.query(models.Category).filter(models.Category.name.ilike(name.strip())).first()

    @staticmethod
    def create(db: Session, category_data: schemas.CategoryCreate) -> models.Category:
        new_category = models.Category(name=category_data.name.strip())
        try:
            db.add(new_category)
            db.commit()
            db.refresh(new_category)
            return new_category
        except Exception as e:
            db.rollback()
            raise e