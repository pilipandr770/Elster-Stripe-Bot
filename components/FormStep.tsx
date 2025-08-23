
import React from 'react';
import { FormStepConfig, TaxFormData } from '../types';
import Input from './Input';

interface FormStepProps {
  stepConfig: FormStepConfig;
  formData: TaxFormData;
  handleChange: (field: keyof TaxFormData, value: string | boolean) => void;
}

const FormStep: React.FC<FormStepProps> = ({ stepConfig, formData, handleChange }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">{stepConfig.title}</h2>
      <p className="mt-1 text-sm text-gray-500">Please fill out the information for this section.</p>
      <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        {stepConfig.fields.map((field) => (
          <div key={field.id} className={field.type === 'checkbox' ? 'sm:col-span-2' : ''}>
            <Input
              id={field.id}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              info={field.info}
              value={formData[field.id]}
              onChange={(e) => {
                const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
                handleChange(field.id, value);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormStep;
