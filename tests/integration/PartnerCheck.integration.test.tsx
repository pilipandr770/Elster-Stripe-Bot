import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PartnerCheck from '../../components/PartnerCheck';
import { CounterpartyCheckResult } from '../../services/counterpartyService';

// Мокаем сервисы для проверки контрагентов
vi.mock('../../services/counterpartyService', () => {
  const mockVatCheckResults: Record<string, CounterpartyCheckResult> = {
    // SAP - известная немецкая IT-компания
    'DE120541342': {
      counterparty_name: 'SAP SE',
      official_name: 'SAP SE',
      check_date: '2025-08-24T10:00:00Z',
      overall_status: 'verified',
      checks: {
        vat_validation: {
          valid: true,
          country_code: 'DE',
          vat_number: '120541342',
          company_name: 'SAP SE',
          company_address: 'Dietmar-Hopp-Allee 16, 69190 Walldorf, Deutschland'
        },
        sanctions_check: {
          is_sanctioned: false,
          matches: [],
          match_count: 0,
          check_date: '2025-08-24T10:00:00Z'
        },
        judicial_check: {
          entity_name: 'SAP SE',
          case_count: 0,
          cases: [],
          check_date: '2025-08-24T10:00:00Z'
        }
      }
    },
    // Siemens - известная немецкая промышленная компания
    'DE129274202': {
      counterparty_name: 'Siemens AG',
      official_name: 'Siemens AG',
      check_date: '2025-08-24T10:00:00Z',
      overall_status: 'verified',
      checks: {
        vat_validation: {
          valid: true,
          country_code: 'DE',
          vat_number: '129274202',
          company_name: 'Siemens AG',
          company_address: 'Werner-von-Siemens-Straße 1, 80333 München, Deutschland'
        },
        sanctions_check: {
          is_sanctioned: false,
          matches: [],
          match_count: 0,
          check_date: '2025-08-24T10:00:00Z'
        },
        judicial_check: {
          entity_name: 'Siemens AG',
          case_count: 1,
          cases: [
            {
              case_number: '123/2024',
              court: 'Landgericht München I',
              date_filed: '2024-03-15',
              description: 'Patentstreit mit einem Wettbewerber',
              status: 'Laufend',
              outcome: null
            }
          ],
          check_date: '2025-08-24T10:00:00Z'
        }
      }
    },
    // Пример санкционированной компании
    'RU123456789': {
      counterparty_name: 'Sanctioned Company Ltd',
      official_name: 'Sanctioned Company Ltd',
      check_date: '2025-08-24T10:00:00Z',
      overall_status: 'sanctioned',
      checks: {
        vat_validation: {
          valid: true,
          country_code: 'RU',
          vat_number: '123456789',
          company_name: 'Sanctioned Company Ltd',
          company_address: 'Somewhere in Moscow, Russia'
        },
        sanctions_check: {
          is_sanctioned: true,
          matches: [
            {
              entity_name: 'Sanctioned Company Ltd',
              list_name: 'EU Consolidated Sanctions List',
              date_listed: '2022-03-15',
              reasons: ['Ukraine-related sanctions'],
              source_url: 'https://example.com/sanctions'
            }
          ],
          match_count: 1,
          check_date: '2025-08-24T10:00:00Z'
        },
        judicial_check: {
          entity_name: 'Sanctioned Company Ltd',
          case_count: 0,
          cases: [],
          check_date: '2025-08-24T10:00:00Z'
        }
      }
    }
  };

  // Реализуем моки для функций сервиса
  return {
    checkCounterparty: vi.fn().mockImplementation(async (name, vatId, profile) => {
      // Если предоставлен VAT ID, который есть в наших тестовых данных
      if (vatId && mockVatCheckResults[vatId]) {
        return Promise.resolve(mockVatCheckResults[vatId]);
      }
      
      // Если предоставлено имя компании, пытаемся найти его в тестовых данных
      if (name) {
        const lowerName = name.toLowerCase();
        for (const result of Object.values(mockVatCheckResults)) {
          if (result.counterparty_name.toLowerCase().includes(lowerName)) {
            return Promise.resolve(result);
          }
        }
      }
      
      // Если ничего не найдено, возвращаем результат по умолчанию
      return Promise.resolve({
        counterparty_name: name || 'Unknown',
        check_date: '2025-08-24T10:00:00Z',
        overall_status: 'unknown',
        checks: {
          vat_validation: {
            valid: false,
            error: 'VAT number not found'
          },
          sanctions_check: {
            is_sanctioned: false,
            matches: [],
            match_count: 0,
            check_date: '2025-08-24T10:00:00Z'
          },
          judicial_check: {
            entity_name: name || 'Unknown',
            case_count: 0,
            cases: [],
            check_date: '2025-08-24T10:00:00Z'
          }
        }
      });
    }),
    mapApiResultToCounterparty: vi.fn().mockImplementation((result) => {
      // Преобразуем результат API в объект Counterparty
      const judicialCases = result.checks.judicial_check?.cases?.map(caseItem => ({
        date: caseItem.date_filed,
        description: caseItem.description,
        status: caseItem.status
      })) || [];

      return {
        id: `cp_${Date.now()}`,
        name: result.official_name || result.counterparty_name,
        vatId: result.checks.vat_validation.country_code && result.checks.vat_validation.vat_number
          ? `${result.checks.vat_validation.country_code}${result.checks.vat_validation.vat_number}`
          : 'N/A',
        status: result.overall_status,
        lastCheck: result.check_date,
        judicialCases
      };
    })
  };
});

// Мокаем сервис профиля пользователя
vi.mock('../../services/profileService', () => {
  const mockProfile = {
    companyName: 'Test Company GmbH',
    vatId: 'DE123456789',
    address: 'Test Street 123, Berlin',
    country: 'Germany'
  };

  return {
    getUserProfile: vi.fn().mockImplementation(() => {
      // Немедленно возвращаем результат для тестов - но все равно через Promise,
      // чтобы эмулировать асинхронное поведение
      return Promise.resolve(null);
    }),
    saveUserProfile: vi.fn().mockImplementation((profile) => {
      return Promise.resolve(profile);
    })
  };
});

describe('PartnerCheck Component Integration Test', () => {
  const mockOnBack = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should render the user profile form initially', async () => {
    render(<PartnerCheck onBack={mockOnBack} />);
    
    // Проверяем, что страница профиля отображается
    expect(screen.getByText('Ihr Firmenprofil')).toBeInTheDocument();
    expect(screen.getByText(/Bitte vervollständigen Sie Ihr Firmenprofil/i)).toBeInTheDocument();
    
    // Сначала должно быть состояние загрузки
    expect(screen.getByText('Profil wird geladen...')).toBeInTheDocument();
    
    // Ждем, когда загрузится форма профиля
    await waitFor(() => {
      expect(screen.getByLabelText(/Firmenname/i)).toBeInTheDocument();
    });
  });

  it('should allow searching for company by name', async () => {
    // Готовим моки для асинхронных функций
    const { checkCounterparty, mapApiResultToCounterparty } = await import('../../services/counterpartyService');
    const { saveUserProfile } = await import('../../services/profileService');
    
    // Рендерим компонент
    render(<PartnerCheck onBack={mockOnBack} />);
    
    // Ждем, пока форма профиля загрузится
    await waitFor(() => {
      expect(screen.queryByText('Profil wird geladen...')).not.toBeInTheDocument();
    });
    
    // Находим форму профиля и заполняем её
    const companyNameInput = screen.getByLabelText('Offizieller Firmenname');
    const vatIdInput = screen.getByLabelText('Umsatzsteuer-Identifikationsnummer (USt-IdNr.)');
    const addressInput = screen.getByLabelText('Anschrift');
    const countryInput = screen.getByLabelText('Land');
    
    fireEvent.change(companyNameInput, { target: { value: 'Test Company GmbH' } });
    fireEvent.change(vatIdInput, { target: { value: 'DE123456789' } });
    fireEvent.change(addressInput, { target: { value: 'Test Street 123, Berlin' } });
    fireEvent.change(countryInput, { target: { value: 'Germany' } });
    
    // Отправляем форму нажатием на кнопку
    const submitButton = screen.getByTestId('save-profile-button');
    fireEvent.click(submitButton);
    
    // Ожидаем, что функция сохранения профиля была вызвана
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
    });
    
    // Ожидаем появления формы поиска
    const searchInput = await screen.findByPlaceholderText(/z\.B\. Tech Solutions AG/i);
    
    // Ищем SAP по названию
    fireEvent.change(searchInput, { target: { value: 'SAP' } });
    // Используем getByRole для поиска кнопки
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    
    // Ждем результатов проверки
    await waitFor(() => {
      expect(checkCounterparty).toHaveBeenCalledWith(
        'SAP', // имя компании
        undefined, // без VAT ID
        expect.any(Object) // профиль пользователя
      );
    });
    
    // Проверяем отображение результатов
    await waitFor(() => {
      expect(screen.getAllByText(/SAP SE/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/DE120541342/i)).toBeInTheDocument();
    });
  });
  
  it('should allow searching for company by VAT ID and show sanctions warning', async () => {
    // Готовим моки для асинхронных функций
    const { checkCounterparty, mapApiResultToCounterparty } = await import('../../services/counterpartyService');
    const { saveUserProfile } = await import('../../services/profileService');
    
    // Рендерим компонент
    render(<PartnerCheck onBack={mockOnBack} />);
    
    // Ждем, пока форма профиля загрузится
    await waitFor(() => {
      expect(screen.queryByText('Profil wird geladen...')).not.toBeInTheDocument();
    });
    
    // Находим форму профиля и заполняем её
    const companyNameInput = screen.getByLabelText('Offizieller Firmenname');
    const vatIdInput = screen.getByLabelText('Umsatzsteuer-Identifikationsnummer (USt-IdNr.)');
    const addressInput = screen.getByLabelText('Anschrift');
    const countryInput = screen.getByLabelText('Land');
    
    fireEvent.change(companyNameInput, { target: { value: 'Test Company GmbH' } });
    fireEvent.change(vatIdInput, { target: { value: 'DE123456789' } });
    fireEvent.change(addressInput, { target: { value: 'Test Street 123, Berlin' } });
    fireEvent.change(countryInput, { target: { value: 'Germany' } });
    
    // Отправляем форму нажатием на кнопку
    const submitButton = screen.getByTestId('save-profile-button');
    fireEvent.click(submitButton);
    
    // Ожидаем, что функция сохранения профиля была вызвана
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
    });
    
    // Ожидаем появления формы поиска
    const searchInput = await screen.findByPlaceholderText(/z\.B\. Tech Solutions AG/i);
    
    // Теперь ищем санкционированную компанию по VAT ID
    fireEvent.change(searchInput, { target: { value: 'RU123456789' } });
    // Используем getByRole для поиска кнопки
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    
    // Ждем результатов проверки
    await waitFor(() => {
      expect(checkCounterparty).toHaveBeenCalledWith(
        undefined, // без имени
        'RU123456789', // VAT ID
        expect.any(Object) // профиль пользователя
      );
    });
    
    // Проверяем отображение предупреждения о санкциях
    await waitFor(() => {
      expect(screen.getAllByText(/Sanctioned Company Ltd/i)[0]).toBeInTheDocument();
      // Для избежания проблем с селектором санкционных предупреждений
      expect(screen.getByText(/WARNUNG/i)).toBeInTheDocument();
    });
  });

  it('should search for Siemens AG and show judicial cases', async () => {
    // Готовим моки для асинхронных функций
    const { checkCounterparty, mapApiResultToCounterparty } = await import('../../services/counterpartyService');
    const { saveUserProfile } = await import('../../services/profileService');
    
    // Рендерим компонент
    render(<PartnerCheck onBack={mockOnBack} />);
    
    // Ждем, пока форма профиля загрузится
    await waitFor(() => {
      expect(screen.queryByText('Profil wird geladen...')).not.toBeInTheDocument();
    });
    
    // Находим форму профиля и заполняем её
    const companyNameInput = screen.getByLabelText('Offizieller Firmenname');
    const vatIdInput = screen.getByLabelText('Umsatzsteuer-Identifikationsnummer (USt-IdNr.)');
    const addressInput = screen.getByLabelText('Anschrift');
    const countryInput = screen.getByLabelText('Land');
    
    fireEvent.change(companyNameInput, { target: { value: 'Test Company GmbH' } });
    fireEvent.change(vatIdInput, { target: { value: 'DE123456789' } });
    fireEvent.change(addressInput, { target: { value: 'Test Street 123, Berlin' } });
    fireEvent.change(countryInput, { target: { value: 'Germany' } });
    
    // Отправляем форму нажатием на кнопку
    const submitButton = screen.getByTestId('save-profile-button');
    fireEvent.click(submitButton);
    
    // Ожидаем, что функция сохранения профиля была вызвана
    await waitFor(() => {
      expect(saveUserProfile).toHaveBeenCalled();
    });
    
    // Ожидаем появления формы поиска
    const searchInput = await screen.findByPlaceholderText(/z\.B\. Tech Solutions AG/i);
    
    // Ищем Siemens AG по VAT ID
    fireEvent.change(searchInput, { target: { value: 'DE129274202' } });
    // Используем getByRole для поиска кнопки
    fireEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    
    // Ждем результатов проверки
    await waitFor(() => {
      expect(checkCounterparty).toHaveBeenCalledWith(
        undefined, // без имени
        'DE129274202', // VAT ID
        expect.any(Object) // профиль пользователя
      );
    });
    
    // Проверяем отображение судебных дел
    await waitFor(() => {
      expect(screen.getAllByText(/Siemens AG/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Patentstreit mit einem Wettbewerber/i)).toBeInTheDocument();
    });
  });
});
