import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStripeTransactions, connectStripeAccount, isStripeConnected, markTransactionAsExpense } from '../../services/stripeService';

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

// Мокаем fetch
global.fetch = vi.fn();

describe('Stripe Service Integration Tests', () => {
  beforeEach(() => {
    // Настраиваем мок для localStorage
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.getItem.mockReturnValue('test_token');
    
    // Сбрасываем моки между тестами
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch transactions with date range', async () => {
    // Мокаем успешный ответ от API
    const mockTransactions = [
      {
        id: 'tx_1',
        date: '2025-08-01T00:00:00Z',
        description: 'Payment for service',
        amount: 100.00,
        currency: 'EUR',
        status: 'succeeded',
        taxAmount: 19.00,
        isExpenseClaimed: false
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTransactions
    });

    // Вызываем функцию с параметрами даты
    const result = await getStripeTransactions('2025-08-01', '2025-08-31');

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/stripe\/transactions\?start_date=2025-08-01&end_date=2025-08-31$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockTransactions);
  });

  it('should connect Stripe account with API key', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { message: 'Stripe account connected successfully' };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Тестовый API ключ
    const testApiKey = 'sk_test_1234567890';

    // Вызываем функцию подключения Stripe-аккаунта
    const result = await connectStripeAccount(testApiKey);

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/stripe\/connect$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        }),
        body: JSON.stringify({ api_key: testApiKey })
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should check if Stripe is connected', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { connected: true };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Вызываем функцию проверки подключения
    const result = await isStripeConnected();

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/stripe\/status$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should mark transaction as expense', async () => {
    // Мокаем успешный ответ от API
    const mockTransaction = {
      id: 'tx_1',
      date: '2025-08-01T00:00:00Z',
      description: 'Office supplies',
      amount: -50.00,
      currency: 'EUR',
      status: 'succeeded',
      taxAmount: 9.50,
      isExpenseClaimed: true
    };
    
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTransaction
    });

    // Вызываем функцию отметки транзакции как расхода
    const result = await markTransactionAsExpense('tx_1');

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/stripe\/transactions\/tx_1\/claim-expense$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        })
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockTransaction);
  });

  it('should handle API errors', async () => {
    // Мокаем ответ с ошибкой
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    // Проверяем, что функция правильно обрабатывает ошибку
    await expect(getStripeTransactions()).rejects.toThrow('HTTP error 401');
  });
});
