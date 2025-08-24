import json
import pytest
from unittest.mock import patch

def test_accounting_endpoint_exists(client):
    """Test that the accounting endpoint is accessible."""
    response = client.get('/api/accounting/status')
    assert response.status_code == 200

@patch('backend.app.api.accounting.process_accounting_query')
def test_accounting_query(mock_process, client):
    """Test the accounting query endpoint."""
    # Setup mock
    mock_process.return_value = {"response": "Mock accounting response"}
    
    # Test data
    test_data = {
        "query": "What are my tax deductions?",
        "user_id": "test123"
    }
    
    # Make request
    response = client.post(
        '/api/accounting/query',
        data=json.dumps(test_data),
        content_type='application/json'
    )
    
    # Assert response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert "response" in data
    assert data["response"] == "Mock accounting response"
    
    # Verify mock was called with correct args
    mock_process.assert_called_once_with(test_data["query"], test_data["user_id"])
