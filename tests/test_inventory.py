import pytest
from app.constants import MovementType 

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
    assert "SKU already registred" in response.json()["detail"]

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
    target_sku = "SEARCH-999"
    product_data = {
        "name": "Search Product",
        "sku": target_sku,
        "category": "Eletronic",
        "price": 500.0,
        "stock_quantity": 2
    }
    await client.post("/products/", json=product_data)
    response = await client.get(f"/products/sku/{target_sku}")
    assert response.status_code == 200
    assert response.json()["sku"] == target_sku

async def test_low_stock_report(client):
    low_stock_data = {
        "name": "mechanical keyboard",
        "sku": "LOW-001",
        "category": "Test",
        "price": 10.0,
        "stock_quantity": 3
    }
    await client.post("/products/", json=low_stock_data)
    response = await client.get("/products/low-stock")
    assert response.status_code == 200
    items = response.json()
    assert any(item["sku"] == "LOW-001" for item in items)

async def test_get_product_not_found(client):
    random_sku = "NON-EXISTENT-122"
    response = await client.get(f"/products/sku/{random_sku}")
    assert response.status_code == 404

async def test_stock_movement_out_success(client):
    product_data = {
        "name": "Mouse Gamer",
        "sku": "MSE-999",
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
    
    response = await client.post("/products/trasaction", json=movement_payload)
    assert response.status_code == 200

async def test_stock_runway_calculation_success(client):
    product_data = {
        "name": "Cabo HDMI",
        "sku": "HDMI-001",
        "category": "Cables",
        "price": 30.0,
        "stock_quantity": 10
    }
    prod_resp = await client.post("/products/", json=product_data)
    product_id = prod_resp.json().get("id", 1)

    movement_payload = {
        "product_id": int(product_id),
        "quantity": 2,
        "movement_type": "out"
    }
    await client.post("/products/trasaction", json=movement_payload)

    response = await client.get("/products/stock-runway")
    assert response.status_code in [200, 404]