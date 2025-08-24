import os
import sys
import pytest

# Add the project root to the path so we can import the app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    from backend.app import create_app
    
    app = create_app(testing=True)
    with app.test_client() as client:
        yield client

@pytest.fixture
def app_context():
    """Create an application context for the tests."""
    from backend.app import create_app
    
    app = create_app(testing=True)
    with app.app_context():
        yield app
