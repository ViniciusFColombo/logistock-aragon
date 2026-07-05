import pytest
from app.database import get_db
from app.main import app
from httpx import AsyncClient, ASGITransport
from app.services.auth_service import AuthService

AuthService.SECRET_KEY = "chave_de_teste_obrigatoria_e_segura_123"

@pytest.fixture
async def client_no_auth(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

async def test_signup_success(client):
    payload = {
        "name": "Novo Dev",
        "email": "novo_dev@logistock.com", 
        "password": "senha_segura_123",
        "role": "operator"
    }
    response = await client.post("/auth/signup", json=payload)
    
    assert response.status_code == 201
    assert response.json()["email"] == "novo_dev@logistock.com"
    assert "id" in response.json()

async def test_signup_forbidden_for_operator(operator_client):
    # Tests whether the lock we placed on the route prevents an operator from registering users.
    payload = {
        "name": "Tentativa Invasao",
        "email": "hacker@logistock.com", 
        "password": "senha_segura_123",
        "role": "operator"
    }
    response = await operator_client.post("/auth/signup", json=payload)
    assert response.status_code == 403

async def test_signup_duplicate_email(client):
    payload = {
        "name": "Repetido",
        "email": "repetido@logistock.com", 
        "password": "senha_123",
        "role": "operator"
    }
    await client.post("/auth/signup", json=payload)
    
    response = await client.post("/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

async def test_login_success(client, client_no_auth):
    payload = {
        "name": "User Login",
        "email": "user_login@logistock.com", 
        "password": "minha_senha_secreta",
        "role": "operator"
    }
    await client.post("/auth/signup", json=payload)
    
    login_data = {"username": "user_login@logistock.com", "password": "minha_senha_secreta"}
    response = await client_no_auth.post("/auth/signin", data=login_data)
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

async def test_login_wrong_password(client, client_no_auth):
    payload = {
        "name": "User Errado",
        "email": "user_errado@logistock.com", 
        "password": "senha_correta",
        "role": "operator"
    }
    await client.post("/auth/signup", json=payload)
    
    login_data = {"username": "user_errado@logistock.com", "password": "senha_errada"}
    response = await client_no_auth.post("/auth/signin", data=login_data)
    
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]