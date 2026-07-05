import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.routes.auth import get_current_user
from app import models
from httpx import AsyncClient, ASGITransport
import os

os.environ["SECRET_KEY"] = "chave_de_teste_com_o_erro_de_grafia_do_seu_service_123"
os.environ["ALGORITHM"] = "HS256"
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_db.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def pytest_configure(config):
    config.option.asyncio_mode = "auto"

class FakeAdminUser:
    id = 1
    name = "Admin Teste"
    email = "admin@logistock.com"
    role = models.UserRole.ADMIN  
    is_active = True
    requires_password_change = False

class FakeOperatorUser:
    id = 2
    name = "Operador Teste"
    email = "operator@logistock.com"
    role = models.UserRole.OPERATOR 
    is_active = True
    requires_password_change = False

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
async def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeAdminUser()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
async def operator_client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: FakeOperatorUser()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()