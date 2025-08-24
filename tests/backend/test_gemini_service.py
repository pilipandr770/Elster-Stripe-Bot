import pytest
from unittest.mock import patch, MagicMock

@patch('backend.app.services.gemini_service.genai')
def test_gemini_service_initialization(mock_genai):
    """Test that the Gemini service can be initialized."""
    from backend.app.services.gemini_service import GeminiService
    
    # Configure mock
    mock_model = MagicMock()
    mock_genai.GenerativeModel.return_value = mock_model
    
    # Create service
    service = GeminiService(api_key="test_key")
    
    # Verify initialization
    assert service is not None
    mock_genai.GenerativeModel.assert_called_once()

@patch('backend.app.services.gemini_service.genai')
def test_gemini_generate_content(mock_genai):
    """Test that the generate_content method works correctly."""
    from backend.app.services.gemini_service import GeminiService
    
    # Configure mock
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Generated response"
    mock_model.generate_content.return_value = mock_response
    mock_genai.GenerativeModel.return_value = mock_model
    
    # Create service and call method
    service = GeminiService(api_key="test_key")
    response = service.generate_content("Test prompt")
    
    # Verify response
    assert response == "Generated response"
    mock_model.generate_content.assert_called_once_with("Test prompt")
