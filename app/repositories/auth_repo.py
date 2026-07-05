from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas

class AuthRepository:
    """
    Isolated data access layer for users and authentication.
    Ensures atomic transactions by persisting new users.
    """

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.email == email).first()
    
    @staticmethod
    def create_user(db: Session, user_data: schemas.UserCreate, hashed_password: str) -> models.User:
        new_user = models.User(
            name=user_data.name,
            email=user_data.email,
            hashed_password=hashed_password,
            role=user_data.role,
            is_active=True,
            requires_password_change=True
        )

        try:
            db.add(new_user)
            db.commit() 
            db.refresh(new_user)
            return new_user
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def update_user_password(db: Session, user: models.User, new_hashed_password: str) -> models.User:
        try:
            user.hashed_password = new_hashed_password
            user.requires_password_change = False
            
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
            
        except Exception as e:
            db.rollback()
            raise e