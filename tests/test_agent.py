import pytest
from unittest.mock import AsyncMock, MagicMock, patch

@pytest.mark.asyncio
@patch("app.services.agent_service.MLService.predict_next_days_sales")
@patch("app.services.agent_service.InventoryRepository.get_product_sales_history")
@patch("app.services.agent_service.InventoryService.get_stock_runway_prediction")
@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
async def test_ask_agent_success(mock_openai_create, mock_runway, mock_sales, mock_ml, client):
    # Simulando os dados que o AgentService espera receber dos outros serviços
    mock_runway.return_value = [{
        'product_id': 1,
        'product_name': 'Monitor LG de Teste',
        'current_stock': 2,
        'avg_sales_per_day': 0.5,
        'estimated_days_left': 4,
        'status': 'CRITICAL'
    }]
    mock_sales.return_value = [] # Histórico vazio simulado com sucesso
    mock_ml.return_value = 5 # Previsão de 5 unidades pelo ML

    # Configurando o Mock da OpenAI
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Los monitores LG necesitan atención urgente."
    mock_response.choices = [mock_choice]
    mock_openai_create.return_value = mock_response

    response = await client.post("/agent/ask", json={"query": "¿Qué produtos necesitan atención?"})

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "Los monitores LG" in json_data["agent_response"]
    mock_openai_create.assert_called_once()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "user_query,expected_mock_response",
    [
        ("¿Qué produtos tienen stock bajo?", "Respuesta en español del asistente simulado."),
        ("Which products have low stock?", "Simulated agent response in English.")
    ]
)
@patch("app.services.agent_service.MLService.predict_next_days_sales")
@patch("app.services.agent_service.InventoryRepository.get_product_sales_history")
@patch("app.services.agent_service.InventoryService.get_stock_runway_prediction")
@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
async def test_ask_agent_languages(mock_openai_create, mock_runway, mock_sales, mock_ml, user_query, expected_mock_response, client):
    mock_runway.return_value = [{
        'product_id': 99,
        'product_name': 'Produto Genérico',
        'current_stock': 1,
        'avg_sales_per_day': 1.0,
        'estimated_days_left': 1,
        'status': 'CRITICAL'
    }]
    mock_sales.return_value = []
    mock_ml.return_value = 7

    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = expected_mock_response
    mock_response.choices = [mock_choice]
    mock_openai_create.return_value = mock_response

    response = await client.post("/agent/ask", json={"query": user_query})

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["agent_response"] == expected_mock_response
    mock_openai_create.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.agent_service.MLService.predict_next_days_sales")
@patch("app.services.agent_service.InventoryRepository.get_product_sales_history")
@patch("app.services.agent_service.InventoryService.get_stock_runway_prediction")
@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
async def test_ask_agent_openai_failure(mock_openai_create, mock_runway, mock_sales, mock_ml, client):
    mock_runway.return_value = [{
        'product_id': 2,
        'product_name': 'Produto Genérico 2',
        'current_stock': 1,
        'avg_sales_per_day': 2.0,
        'estimated_days_left': 0.5,
        'status': 'CRITICAL'
    }]
    mock_sales.return_value = []
    mock_ml.return_value = 10
    
    mock_openai_create.side_effect = Exception("OpenAI API is overloaded")

    response = await client.post("/agent/ask", json={"query": "¿Qué produtos necesitan atención?"})

    assert response.status_code == 200
    json_data = response.json()
    assert "status" in json_data
    assert "Error processing AI Agent request" in json_data["agent_response"]
    mock_openai_create.assert_called_once()


@pytest.mark.asyncio
async def test_ask_agent_validation_error(client):
    response = await client.post("/agent/ask", json={"query": "Ok"})
    assert response.status_code == 422