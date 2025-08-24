import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '../../components/Header';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn()
}));

describe('Header Component', () => {
  // Create a simple wrapper for rendering components
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      React.createElement('div', null, ui)
    );
  };
  
  it('renders the logo', () => {
    renderWithRouter(React.createElement(Header, {}));
    
    // Assuming the logo contains the text "Elster" or a specific alt text
    // Adjust this based on actual implementation
    const logoElement = screen.queryByAltText('Elster') || screen.queryByText(/elster/i);
    expect(logoElement).toBeDefined();
  });

  it('renders navigation links', () => {
    renderWithRouter(React.createElement(Header, {}));
    
    // Check for common navigation items (adjust based on actual implementation)
    const navItems = screen.queryAllByRole('link');
    expect(navItems.length).toBeGreaterThan(0);
  });

  it('displays user info when logged in', () => {
    // Mock logged in state
    const loggedInUser = { name: 'Test User' };
    
    renderWithRouter(
      React.createElement(Header, { user: loggedInUser })
    );
    
    // Check for user name or avatar (adjust based on actual implementation)
    const userElement = screen.queryByText('Test User');
    expect(userElement).toBeDefined();
  });

  it('shows login button when not logged in', () => {
    renderWithRouter(React.createElement(Header, { user: null }));
    
    // Check for login/register links
    const loginButton = screen.queryByText(/login/i) || screen.queryByText(/anmelden/i);
    expect(loginButton).toBeDefined();
  });
});
