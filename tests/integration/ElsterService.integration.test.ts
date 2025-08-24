import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getSubmissions, 
  getSubmission, 
  submitTaxDeclaration, 
  connectElsterAccount, 
  isElsterConnected, 
  getSubmissionFrequency,
  setSubmissionFrequency
} from '../../services/elsterService';

// Мокаем localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn()
};

// Мокаем fetch
global.fetch = vi.fn();

describe('ELSTER Service Integration Tests', () => {
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

  it('should fetch submissions list', async () => {
    // Мокаем успешный ответ от API
    const mockSubmissions = [
      {
        id: 'sub_1',
        timestamp: '2025-08-01T00:00:00Z',
        period: 'Q3 2025',
        status: 'processing',
        transactionIds: ['tx_1', 'tx_2']
      }
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissions
    });

    // Вызываем функцию для получения списка отправок
    const result = await getSubmissions();

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/submissions$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockSubmissions);
  });

  it('should fetch a specific submission', async () => {
    // Мокаем успешный ответ от API
    const mockSubmission = {
      id: 'sub_1',
      timestamp: '2025-08-01T00:00:00Z',
      period: 'Q3 2025',
      status: 'processing',
      transactionIds: ['tx_1', 'tx_2'],
      details: {
        transferTicket: 'ERIC-1234',
        totalAmount: 1000,
        totalTax: 190
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmission
    });

    // Вызываем функцию для получения конкретной отправки
    const result = await getSubmission('sub_1');

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/submissions\/sub_1$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockSubmission);
  });

  it('should submit a tax declaration', async () => {
    // Мокаем успешный ответ от API
    const mockSubmissionResult = {
      id: 'sub_new',
      timestamp: '2025-08-24T12:00:00Z',
      period: 'Q3 2025',
      status: 'processing',
      transactionIds: ['tx_1', 'tx_2']
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubmissionResult
    });

    // Вызываем функцию для отправки налоговой декларации
    const period = 'Q3 2025';
    const transactionIds = ['tx_1', 'tx_2'];
    const result = await submitTaxDeclaration(period, transactionIds);

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/submit$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        }),
        body: JSON.stringify({
          period,
          transaction_ids: transactionIds
        })
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockSubmissionResult);
  });

  it('should connect ELSTER account', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { message: 'ELSTER account connected successfully' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Тестовый налоговый номер
    const taxId = '123 456 78901';
    
    // Данные формы
    const taxFormData = {
      fullName: 'Test User',
      streetAddress: 'Test Street 123',
      city: 'Berlin',
      postalCode: '10115',
      taxId: taxId, // Adding taxId to match the TaxFormData interface
      bankName: 'Test Bank',
      iban: 'DE89 3704 0044 0532 0130 00',
      consent: true
    };

    // Вызываем функцию подключения ELSTER-аккаунта
    const result = await connectElsterAccount(taxId, taxFormData);

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/connect$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        }),
        body: JSON.stringify({
          tax_id: taxId,
          form_data: taxFormData
        })
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should check if ELSTER is connected', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { connected: true };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Вызываем функцию проверки подключения
    const result = await isElsterConnected();

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/status$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should get submission frequency', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { frequency: 'quarterly' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Вызываем функцию получения частоты подачи
    const result = await getSubmissionFrequency();

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/frequency$/),
      expect.objectContaining({
        method: 'GET',
        headers: { 'Authorization': 'Bearer test_token' }
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should set submission frequency', async () => {
    // Мокаем успешный ответ от API
    const mockResponse = { message: 'Frequency updated successfully' };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Вызываем функцию установки частоты подачи
    const result = await setSubmissionFrequency('annually');

    // Проверяем, что fetch был вызван с правильными параметрами
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/elster\/frequency$/),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_token'
        }),
        body: JSON.stringify({ frequency: 'annually' })
      })
    );

    // Проверяем результат
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    // Мокаем ответ с ошибкой
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' })
    });

    // Проверяем, что функция правильно обрабатывает ошибку
    await expect(getSubmissions()).rejects.toThrow('HTTP error 401');
  });
});
