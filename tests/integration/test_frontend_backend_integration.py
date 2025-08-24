import pytest
import os
import time
import subprocess
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

"""
Note: To run these integration tests, you need to install:
- selenium
- pytest
- webdriver-manager

Run: pip install selenium pytest webdriver-manager
"""

@pytest.fixture(scope="module")
def backend_server():
    """Start the backend server for testing."""
    # Start the Flask backend server
    process = subprocess.Popen(
        ["python", "backend/run.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "FLASK_ENV": "testing"}
    )
    
    # Wait for server to start
    time.sleep(2)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:5000/api/health")
        if response.status_code != 200:
            pytest.skip("Backend server didn't start properly")
    except requests.ConnectionError:
        process.kill()
        pytest.skip("Backend server didn't start properly")
    
    yield process
    
    # Teardown - kill the server
    process.kill()

@pytest.fixture(scope="module")
def frontend_server():
    """Start the frontend dev server for testing."""
    # Start the Vite dev server
    process = subprocess.Popen(
        ["npm", "run", "dev", "--", "--port", "3000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for server to start
    time.sleep(5)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:3000")
        if response.status_code >= 400:
            pytest.skip("Frontend server didn't start properly")
    except requests.ConnectionError:
        process.kill()
        pytest.skip("Frontend server didn't start properly")
    
    yield process
    
    # Teardown - kill the server
    process.kill()

@pytest.fixture(scope="function")
def browser():
    """Setup and teardown the browser for tests."""
    from selenium.webdriver.chrome.service import Service as ChromeService
    from webdriver_manager.chrome import ChromeDriverManager
    
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Run in headless mode
    
    driver = webdriver.Chrome(
        service=ChromeService(ChromeDriverManager().install()),
        options=options
    )
    
    yield driver
    
    driver.quit()

def test_landing_page_loads(frontend_server, browser):
    """Test that the landing page loads correctly."""
    browser.get("http://localhost:3000")
    
    # Wait for the page to load
    wait = WebDriverWait(browser, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
    
    # Check that the page loaded correctly
    assert "Elster" in browser.title or "Steuer" in browser.title

@pytest.mark.skipif(True, reason="Requires authentication to be implemented")
def test_chat_assistant_api_integration(frontend_server, backend_server, browser):
    """Test the chat assistant interaction with the backend API."""
    # Login first (implementation depends on your auth system)
    browser.get("http://localhost:3000/login")
    
    # Fill login form
    browser.find_element(By.ID, "username").send_keys("test@example.com")
    browser.find_element(By.ID, "password").send_keys("test123")
    browser.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    # Wait for login to complete
    wait = WebDriverWait(browser, 10)
    wait.until(EC.url_contains("dashboard"))
    
    # Navigate to chat assistant
    browser.get("http://localhost:3000/chat")
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".chat-container")))
    
    # Send a message
    message_input = browser.find_element(By.CSS_SELECTOR, ".chat-input")
    message_input.send_keys("What are my tax deductions?")
    browser.find_element(By.CSS_SELECTOR, ".send-button").click()
    
    try:
        # Wait for response from backend
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".assistant-message")))
        
        # Check that we got a response
        response_element = browser.find_element(By.CSS_SELECTOR, ".assistant-message")
        assert response_element.text.strip() != ""
        
    except TimeoutException:
        pytest.fail("No response received from the assistant within the timeout period")
