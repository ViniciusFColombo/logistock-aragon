import pytest
from app.database import get_db
from app.main import app
from httpx import AsyncClient, ASGITransport
from app.services.auth_service import AuthService

AuthService.SECRECT_KEY = "chave_de_teste_obrigatoria_e_segura_123"
AuthService.SECRET_KEY = "chave_de_teste_obrigatoria_e_segura_123"

@pytest.fixture
async def client_no_auth(db_session):
    """Clean client without any mock/override in get_current_user to test the real login."""
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


async def test_signup_success(client_no_auth):
    payload = {"username": "novo_dev", "password": "senha_segura_123"}
    response = await client_no_auth.post("/auth/signup", json=payload)
    
    assert response.status_code == 201
    assert response.json()["username"] == "novo_dev"
    assert "id" in response.json()

async def test_signup_duplicate_username(client_no_auth):
    payload = {"username": "repetido", "password": "senha_123"}
    await client_no_auth.post("/auth/signup", json=payload)
    
    response = await client_no_auth.post("/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Username already registred" in response.json()["detail"]


async def test_login_success(client_no_auth):
    payload = {"username": "user_login", "password": "minha_senha_secreta"}
    await client_no_auth.post("/auth/signup", json=payload)
    
    login_data = {"username": "user_login", "password": "minha_senha_secreta"}
    response = await client_no_auth.post("/auth/signin", data=login_data)
    
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"


async def test_login_wrong_password(client_no_auth):
    payload = {"username": "user_errado", "password": "senha_correta"}
    await client_no_auth.post("/auth/signup", json=payload)
    
    login_data = {"username": "user_errado", "password": "senha_errada"}
    response = await client_no_auth.post("/auth/signin", data=login_data)
    
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]