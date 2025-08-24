import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from '../../components/Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    render(<Input label="Username" name="username" />);
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    
    render(<Input 
      label="Email" 
      name="email" 
      value=""
      onChange={handleChange} 
    />);
    
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(
      <Input 
        label="Password" 
        name="password" 
        error="Password is required" 
      />
    );
    
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('applies additional className when provided', () => {
    render(
      <Input 
        label="Custom Input" 
        name="custom" 
        className="custom-class" 
      />
    );
    
    const inputContainer = screen.getByLabelText('Custom Input').closest('div');
    expect(inputContainer).toHaveClass('custom-class');
  });
});
