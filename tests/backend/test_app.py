def test_app_exists(app_context):
    """Test that the app exists."""
    assert app_context is not None

def test_api_routes_exist(client):
    """Test that the main API routes are registered."""
    # Get all registered routes
    routes = [rule.rule for rule in client.application.url_map.iter_rules()]
    
    # Check that the key API routes exist
    assert '/api/accounting' in routes
    assert '/api/marketing' in routes
    assert '/api/secretary' in routes
    assert '/api/partner_check' in routes
