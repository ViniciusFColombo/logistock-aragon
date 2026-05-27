from sqlalchemy.orm import Session
from typing import Optional
from app import models

class AuthRepository:
    """
    Isolated data access layer for users and authentication.
    Ensures atomic transactions by persisting new users.
    """

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional [models.User]:
        return db.query(models.User).filter(models.User.username == username).first()
    
    @staticmethod
    def create_user(db: Session, username: str, hashed_password: str) -> models.User:
        new_user = models.User(username=username, hashed_password=hashed_password)

        if db.in_transaction():
            db.add(new_user)
            db.flush()
        else:
            with db.begin():
                db.add(new_user)

        db.refresh(new_user)
        return new_user