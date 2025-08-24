import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatAssistant from '../../components/ChatAssistant';

// Mock необходимых сервисов и API
vi.mock('../../services/geminiService', () => ({
  streamChat: vi.fn().mockImplementation(async function* () {
    yield 'Mock AI response';
    return;
  }),
  getModuleModelPreference: vi.fn().mockReturnValue('gemini'),
  saveModuleModelPreference: vi.fn(),
  // Mock any other required functions
  AIModelType: undefined
}));

describe('ChatAssistant Component Integration Test', () => {
  // Подготовка мока для модуля
  const mockModule = {
    id: 'accounting',
    name: 'Accounting',
    icon: 'TaxIcon',
    description: 'Help with accounting tasks'
  };

  // Подготовка мока для пользователя
  const mockUser = {
    id: '1',
    email: 'testuser@example.com',
    role: 'user'
  };

  beforeEach(() => {
    // Сброс моков перед каждым тестом
    vi.clearAllMocks();
  });

  it('should render chat interface correctly', () => {
    render(<ChatAssistant module={mockModule} user={mockUser} />);
    
    // Сначала проверим, что кнопка для открытия чата отображается
    const chatToggleButton = screen.getByLabelText('Chat umschalten');
    expect(chatToggleButton).toBeInTheDocument();
    
    // Кликаем на кнопку, чтобы открыть чат
    fireEvent.click(chatToggleButton);
    
    // Теперь проверяем, что интерфейс чата отображается корректно с правильным заголовком
    expect(screen.getByText('Elster Helfer')).toBeInTheDocument();
    
    // Проверяем приветственное сообщение
    expect(screen.getByText('Hallo! Wie kann ich Ihnen heute helfen?')).toBeInTheDocument();
    
    // Проверяем наличие поля ввода сообщения
    const inputElement = screen.getByPlaceholderText('Geben Sie Ihre Frage ein...');
    expect(inputElement).toBeInTheDocument();
    
    // Находим форму обычным селектором, так как она не имеет role="form"
    const formElement = document.querySelector('form');
    expect(formElement).not.toBeNull();
    
    // Проверяем наличие кнопки отправки (кнопка типа submit внутри формы)
    const submitButton = screen.getByRole('button', { name: '' });
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toBeInTheDocument();
  });

  it('should allow sending a message and display response', async () => {
    const { streamChat } = await import('../../services/geminiService');
    
    render(<ChatAssistant module={mockModule} user={mockUser} />);
    
    // Открываем чат
    const chatToggleButton = screen.getByLabelText('Chat umschalten');
    fireEvent.click(chatToggleButton);
    
    // Находим элементы ввода и кнопку
    const inputElement = screen.getByPlaceholderText('Geben Sie Ihre Frage ein...');
    
    // Находим кнопку отправки
    const sendButton = screen.getByRole('button', { name: '' });
    expect(sendButton).toHaveAttribute('type', 'submit');
    
    // Вводим сообщение
    fireEvent.change(inputElement, { target: { value: 'Test message' } });
    
    // Находим форму с помощью DOM API
    const formElement = document.querySelector('form');
    expect(formElement).not.toBeNull();
    
    // Отправляем форму напрямую для гарантированного срабатывания события submit
    fireEvent.submit(formElement!);
    
    // Поскольку сообщение должно попасть в компонент через state, 
    // использовать waitFor для проверки появления в DOM
    await waitFor(() => {
      // Ищем div с текстом "Test message" внутри компонента чата
      const messageContainers = Array.from(document.querySelectorAll('.bg-primary.text-white'));
      const hasUserMessage = messageContainers.some(container => 
        container.textContent?.includes('Test message')
      );
      expect(hasUserMessage).toBe(true);
    });
    
    // Проверяем вызов метода streamChat с корректными параметрами
    expect(streamChat).toHaveBeenCalledWith(
      'Test message', 
      mockModule, // вместо mockModule.id передается весь объект
      'gemini'
    );
    
    // Ожидаем ответа AI и проверяем, что он отображается
    await waitFor(() => {
      const messageContainers = Array.from(document.querySelectorAll('.bg-gray-200.text-gray-800'));
      const hasAiResponse = messageContainers.some(container => 
        container.textContent?.includes('Mock AI response')
      );
      expect(hasAiResponse).toBe(true);
    });
  });
});
