import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
def test_ask_agent_success(mock_openai_create):
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Los monitores LG necesitan atención urgente."
    mock_response.choices = [mock_choice]
    mock_openai_create.return_value = mock_response

    response = client.post("/agent/ask", json={"query": "¿Qué productos necesitan atención?"})

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert "Los monitores LG" in json_data["agent_response"]
    mock_openai_create.assert_called_once()


@pytest.mark.parametrize(
    "user_query,expected_mock_response",
    [
        ("¿Qué productos tienen stock bajo?", "Respuesta en español del asistente simulado."),
        ("Which products have low stock?", "Simulated agent response in English.")
    ]
)
@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
def test_ask_agent_languages(mock_openai_create, user_query, expected_mock_response):
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = expected_mock_response
    mock_response.choices = [mock_choice]
    mock_openai_create.return_value = mock_response

    response = client.post("/agent/ask", json={"query": user_query})

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "success"
    assert json_data["agent_response"] == expected_mock_response
    mock_openai_create.assert_called_once()


@patch("app.services.agent_service.client.chat.completions.create", new_callable=AsyncMock)
def test_ask_agent_openai_failure(mock_openai_create):
    """
    Objective: To ensure resilience in case the OpenAI service fails,
    even if the request comes in JSON format.
    """
    mock_openai_create.side_effect = Exception("OpenAI API is overloaded")

    response = client.post("/agent/ask", json={"query": "¿Qué productos necesitan atención?"})

    assert response.status_code == 200
    json_data = response.json()
    assert "status" in json_data
    assert "Error processing AI Agent request" in json_data["agent_response"]
    mock_openai_create.assert_called_once()

def test_ask_agent_validation_error():
    response = client.post("/agent/ask", json={"query": "Ok"})
    
    assert response.status_code == 422