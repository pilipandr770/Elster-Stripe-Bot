import os
import json
import requests
from typing import Dict, Any

def create_mcp_server_request(server_url: str, request_body: Dict[str, Any]) -> str:
    """
    Make a request to an MCP (Model Context Protocol) server
    
    Args:
        server_url: The URL of the MCP server
        request_body: The request body to send
        
    Returns:
        The response content as a string
    """
    try:
        response = requests.post(
            server_url,
            json=request_body,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code != 200:
            raise Exception(f"MCP server returned status code {response.status_code}: {response.text}")
        
        response_data = response.json()
        
        # Extract content from the response based on MCP format
        if "messages" in response_data and len(response_data["messages"]) > 0:
            return response_data["messages"][-1].get("content", "")
        
        return ""
    
    except Exception as e:
        print(f"Error in MCP request: {str(e)}")
        raise
