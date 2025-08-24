import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Input from '../../components/Input';

describe('Input Component', () => {
  it('renders correctly with label', () => {
    render(<Input label="Username" name="username" />);
    
    // Проверяем, что label отображается
    expect(screen.getByText('Username')).toBeInTheDocument();
    // Проверяем, что input существует
    expect(screen.getByRole('textbox', { name: 'Username' })).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    
    render(<Input 
      label="Email" 
      name="email" 
      value=""
      onChange={handleChange} 
    />);
    
    // Находим input по роли и атрибуту
    const input = screen.getByRole('textbox', { name: 'Email' });
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(
      <Input 
        label="Password" 
        name="password" 
        error="Password is required" 
        type="password"
      />
    );
    
    // Проверяем, что сообщение об ошибке отображается
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
    
    // Ищем родительский div
    const inputContainer = screen.getByText('Custom Input').closest('div');
    expect(inputContainer).toHaveClass('custom-class');
  });
});
