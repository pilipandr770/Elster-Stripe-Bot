import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaxForm from '../../components/TaxForm';

// Мокаем сервис elsterService
vi.mock('../../services/elsterService', () => {
  return {
    connectElsterAccount: vi.fn().mockResolvedValue({ message: 'ELSTER account connected successfully' })
  };
});

describe('TaxForm Component Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render the form steps correctly', () => {
    render(<TaxForm />);
    
    // Check that the first form step is displayed with its correct title
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
  });

  it('should allow navigation between steps', async () => {
    render(<TaxForm />);
    
    // Fill in the first step (Personal Information)
    const fullNameInput = screen.getByLabelText(/Full Name/i);
    const streetAddressInput = screen.getByLabelText(/Street Address/i);
    const cityInput = screen.getByLabelText(/City/i);
    const postalCodeInput = screen.getByLabelText(/Postal Code/i);
    
    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(streetAddressInput, { target: { value: 'Test Street 123' } });
    fireEvent.change(cityInput, { target: { value: 'Berlin' } });
    fireEvent.change(postalCodeInput, { target: { value: '10115' } });
    
    // Click Next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    // Check that the second step is displayed
    await waitFor(() => {
      // Looking specifically for the heading that indicates we're on the Tax Details step
      expect(screen.getByRole('heading', { name: 'Tax Details' })).toBeInTheDocument();
    });
    
    // Fill in second step
    const taxIdInput = screen.getByLabelText(/German Tax ID/i);
    fireEvent.change(taxIdInput, { target: { value: '01 234 567 890' } });
    
    // Check that we can go back to the previous step
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);
    
    // Check that we're back on the first step
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();
    });
  });

  it('should submit form data and connect ELSTER account', async () => {
    const { connectElsterAccount } = await import('../../services/elsterService');
    
    render(<TaxForm />);
    
    // Step 1: Personal Information
    const fullNameInput = screen.getByLabelText(/Full Name/i);
    const streetAddressInput = screen.getByLabelText(/Street Address/i);
    const cityInput = screen.getByLabelText(/City/i);
    const postalCodeInput = screen.getByLabelText(/Postal Code/i);
    
    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
    fireEvent.change(streetAddressInput, { target: { value: 'Test Street 123' } });
    fireEvent.change(cityInput, { target: { value: 'Berlin' } });
    fireEvent.change(postalCodeInput, { target: { value: '10115' } });
    
    // Navigate to next step
    fireEvent.click(screen.getByText('Next'));
    
    // Step 2: Tax Details
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Tax Details' })).toBeInTheDocument();
    });
    
    const taxIdInput = screen.getByLabelText(/German Tax ID/i);
    const bankNameInput = screen.getByLabelText(/Bank Name/i);
    const ibanInput = screen.getByLabelText(/IBAN/i);
    
    fireEvent.change(taxIdInput, { target: { value: '01 234 567 890' } });
    fireEvent.change(bankNameInput, { target: { value: 'Test Bank' } });
    fireEvent.change(ibanInput, { target: { value: 'DE89 3704 0044 0532 0130 00' } });
    
    // Navigate to next step
    fireEvent.click(screen.getByText('Next'));
    
    // Step 3: Declaration
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Declaration' })).toBeInTheDocument();
    });
    
    const consentCheckbox = screen.getByLabelText(/I declare that the information provided is accurate/i);
    fireEvent.click(consentCheckbox);
    
    // Submit the form
    const submitButton = screen.getByText('Submit Declaration');
    fireEvent.click(submitButton);
    
    // Check that connectElsterAccount was called with correct parameters
    await waitFor(() => {
      expect(connectElsterAccount).toHaveBeenCalledWith(
        '01 234 567 890',
        expect.objectContaining({
          fullName: 'Test User',
          streetAddress: 'Test Street 123',
          city: 'Berlin',
          postalCode: '10115',
          bankName: 'Test Bank',
          iban: 'DE89 3704 0044 0532 0130 00',
          consent: true
        })
      );
    });
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText('Submission Successful!')).toBeInTheDocument();
    });
  });
});
