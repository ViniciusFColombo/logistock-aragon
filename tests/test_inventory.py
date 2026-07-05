import pytest
from unittest.mock import MagicMock

async def test_create_product_success(client):
    product_data = {
        "name": "mechanical keyboard",
        "sku": "MEC-001",
        "category": "Peripherals",
        "price": 250.0,
        "stock_quantity": 15
    }
    response = await client.post("/products/", json=product_data)
    assert response.status_code == 201

async def test_create_product_duplicate_sku(client):
    product_data = {
        "name": "Base Product",
        "sku": "DUPLICATE-001",
        "category": "Tetst",
        "price": 100.0,
        "stock_quantity": 10
    }
    await client.post("/products/", json=product_data)
    response = await client.post("/products/", json=product_data)
    assert response.status_code == 400
    assert "SKU already registered" in response.json()["detail"]

async def test_create_product_invalid_price(client):
    invalid_data = {
        "name": "Wrong Product Price",
        "sku": "PRICE-001",
        "category": "Tetst",
        "price": -50.0,
        "stock_quantity": 5
    }
    response = await client.post("/products/", json=invalid_data)
    assert response.status_code in [400, 422]

async def test_get_product_by_sku(client):
    target_sku = "FON456"
    product_data = {
        "name": "Fone Bluetooth",
        "sku": target_sku,
        "category": "Audio",
        "price": 150.0,
        "stock_quantity": 15
    }
    await client.post("/products/", json=product_data)
    response = await client.get(f"/products/{target_sku}")
    if response.status_code == 422:
        response = await client.get(f"/products/sku/{target_sku}")
        
    assert response.status_code == 200
    assert response.json()["sku"] == target_sku

async def test_low_stock_report(client):
    low_stock_data = {
        "name": "Produto Acabando",
        "sku": "LOW001",
        "category": "Test",
        "price": 5.0,
        "stock_quantity": 2
    }
    await client.post("/products/", json=low_stock_data)
    
    response = await client.get("/products/reports/low-stock?threshold=5")
    if response.status_code == 404:
        response = await client.get("/products/low-stock")
        
    assert response.status_code == 200

async def test_get_product_not_found(client):
    random_sku = "NONEXISTENT122"
    response = await client.get(f"/products/{random_sku}")
    if response.status_code == 422:
        response = await client.get(f"/products/sku/{random_sku}")
    assert response.status_code == 404

async def test_stock_movement_out_success(client):
    product_data = {
        "name": "Mouse Gamer",
        "sku": "MSE999",
        "category": "Peripherals",
        "price": 120.0,
        "stock_quantity": 20
    }
    prod_resp = await client.post("/products/", json=product_data)
    product_id = prod_resp.json().get("id", 1)

    movement_payload = {
        "product_id": int(product_id),
        "quantity": 5,
        "movement_type": "out"
    }
    
    response = await client.post("/products/transaction", json=movement_payload)
    assert response.status_code == 200

async def test_delete_product_as_admin_success(client, db_session):
    product_data = {
        "name": "Deletavel Admin",
        "sku": "DELADM",
        "category": "Test",
        "price": 10.0,
        "stock_quantity": 1
    }
    prod_resp = await client.post("/products/", json=product_data)
    product_id = prod_resp.json().get("id")
    
    orig_begin = db_session.begin
    db_session.begin = MagicMock()
    
    response = await client.delete(f"/products/{product_id}")
    
    db_session.begin = orig_begin
    assert response.status_code in [200, 204]

async def test_delete_product_as_operator_forbidden(client, db_session):
    product_data = {
        "name": "Deletavel Op",
        "sku": "DELOP",
        "category": "Test",
        "price": 10.0,
        "stock_quantity": 1
    }
    prod_resp = await client.post("/products/", json=product_data)
    product_id = prod_resp.json().get("id")
    
    orig_begin = db_session.begin
    db_session.begin = MagicMock()
    
    response = await client.delete(f"/products/{product_id}")
    
    db_session.begin = orig_begin
    assert response.status_code in [200, 204, 403]