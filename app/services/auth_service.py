import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app import models, schemas
from app.repositories.auth_repo import AuthRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class AuthService:
    """
    Service layer responsible for the Authentication logic,
    Encryption, Issuance and Validation of JWT Tokens.
    """

    @staticmethod
    def get_password_hash(password: str) -> str:
        """Transforms a plaintext password into a secure hash."""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
       return pwd_context.verify(plain_password, hashed_password) 

    @staticmethod
    def create_access_token(data: dict) -> str:
        """Generates a JWT token with a configured expiration time."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})

        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    @staticmethod
    def signup_user(db: Session, user_data: schemas.UserCreate) -> models.User:
        existing_user = AuthRepository.get_user_by_username(db, user_data.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registred"
            )
        
        #The service calculates the hash here, isolating the persistence rule.
        hashed_pwd = AuthService.get_password_hash(user_data.password)
        return AuthRepository.create_user(db, user_data.username, hashed_pwd)
    
    @staticmethod
    def signin_user(db: Session, form_data) -> dict:
        user = AuthRepository.get_user_by_username(db, form_data.username)
        if not user or not AuthService.verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token = AuthService.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}
    
    @staticmethod
    def get_current_user(db: Session, token: str) -> models.User:
        """Decodes the JWT token and validates whether the requesting user is active."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

        try:
            payload= jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
        
        user = AuthRepository.get_user_by_username(db, username)
        if user is None:
            raise credentials_exception
        
        return user