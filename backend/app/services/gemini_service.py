import os
import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    """
    Service class for interacting with Google's Gemini AI models
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the Gemini service with an API key
        
        Args:
            api_key: The API key to use for Gemini. If None, will try to get from environment.
        """
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.warning("No Gemini API key provided or found in environment")
            
        # Configure the Gemini API
        genai.configure(api_key=self.api_key)
        
        # Default model
        self.model_name = "gemini-pro"
        self.model = genai.GenerativeModel(self.model_name)
    
    def generate_content(self, prompt, model_name=None):
        """
        Generate content using Gemini model
        
        Args:
            prompt: The prompt to send to the Gemini model
            model_name: Optional override for the model name
            
        Returns:
            Generated text from the model
        """
        try:
            if not self.api_key:
                logger.error("Gemini API key not configured")
                return "Error: Gemini API key not configured"
            
            # Use specified model or default
            if model_name and model_name != self.model_name:
                self.model_name = model_name
                self.model = genai.GenerativeModel(model_name)
                
            # Generate response
            response = self.model.generate_content(prompt)
            
            if hasattr(response, 'text'):
                return response.text
            else:
                logger.warning("Empty response from Gemini")
                return "No response generated"
        
        except Exception as e:
            logger.error(f"Error generating Gemini response: {str(e)}")
            return f"Error: {str(e)}"

# Initialize a global instance with default configuration
_gemini_service = None

def get_gemini_service():
    """Get or create the global Gemini service instance"""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

def get_gemini_response(prompt, model_name="gemini-pro"):
    """
    Get a response from Gemini AI model using the global service instance
    
    Args:
        prompt: The prompt to send to the Gemini model
        model_name: The name of the Gemini model to use
        
    Returns:
        Response text from the Gemini model
    """
    service = get_gemini_service()
    return service.generate_content(prompt, model_name)

def generate_response(prompt, model_name="gemini-pro"):
    """Alias for get_gemini_response for backward compatibility"""
    return get_gemini_response(prompt, model_name)

# Helper function for Google Calendar integration
def format_calendar_events(events_data):
    """
    Format calendar events for display
    
    Args:
        events_data: List of calendar event objects
        
    Returns:
        Formatted string with event details
    """
    if not events_data or not isinstance(events_data, list):
        return "No events found"
        
    formatted_events = []
    for event in events_data:
        start = event.get('start', {}).get('dateTime', event.get('start', {}).get('date', 'Unknown'))
        summary = event.get('summary', 'Untitled event')
        formatted_events.append(f"- {start}: {summary}")
    
    return "\n".join(formatted_events)