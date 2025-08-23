
import React, { useState, useCallback } from 'react';
import { FORM_STEPS, INITIAL_TAX_FORM_DATA } from '../constants';
import { TaxFormData } from '../types';
import StepIndicator from './StepIndicator';
import FormStep from './FormStep';
import Button from './Button';
import { CheckIcon } from './icons/CheckIcon';

const TaxForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<TaxFormData>(INITIAL_TAX_FORM_DATA);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = useCallback(() => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleChange = useCallback((field: keyof TaxFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Submitting Form Data:', formData);
      
      // Import the service dynamically to avoid issues with SSR
      const { connectElsterAccount } = await import('../services/elsterService');
      
      // Connect ELSTER account with tax ID and form data
      await connectElsterAccount(formData.taxId, formData);
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit tax form. Please try again.');
    }
  };
  
  const isCurrentStepValid = () => {
    const currentStepFields = FORM_STEPS[currentStep].fields;
    return currentStepFields.every(field => {
      if (field.type === 'checkbox') {
        return formData[field.id];
      }
      return formData[field.id] !== '';
    });
  };

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto text-center animate-fade-in">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <CheckIcon className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Submission Successful!</h2>
        <p className="mt-2 text-gray-600">
          Your tax information has been logged to the console. This is a demonstration of the data collection process.
        </p>
        <pre className="mt-4 text-left bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
          {JSON.stringify(formData, null, 2)}
        </pre>
        <Button onClick={() => { setIsSubmitted(false); setCurrentStep(0); setFormData(INITIAL_TAX_FORM_DATA); }} className="mt-6">
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} steps={FORM_STEPS.map(s => s.title)} />
      <div className="bg-white rounded-lg shadow-xl mt-8 p-6 sm:p-8">
        <form onSubmit={handleSubmit}>
          <FormStep
            stepConfig={FORM_STEPS[currentStep]}
            formData={formData}
            handleChange={handleChange}
          />
          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
            <div>
              {currentStep > 0 && (
                <Button type="button" onClick={handleBack} variant="secondary">
                  Back
                </Button>
              )}
            </div>
            <div>
              {currentStep < FORM_STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext} disabled={!isCurrentStepValid()}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={!formData.consent}>
                  Submit Declaration
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaxForm;
