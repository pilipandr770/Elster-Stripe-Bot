
import React from 'react';
import { InfoIcon } from './icons/InfoIcon';

interface InputProps {
  id: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'checkbox' | 'password';
  value: string | boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  info?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  info
}) => {
  if (type === 'checkbox') {
    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            id={id}
            name={id}
            type="checkbox"
            checked={!!value}
            onChange={onChange}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
        <div className="ml-3 text-sm leading-6">
          <label htmlFor={id} className="font-medium text-gray-900">
            {label}
          </label>
          {info && <p className="text-gray-500">{info}</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="flex items-center text-sm font-medium text-gray-700">
        {label}
        {info && (
          <div className="group relative ml-2">
            <InfoIcon className="h-4 w-4 text-gray-400" />
            <div className="absolute bottom-full mb-2 w-64 -translate-x-1/2 left-1/2 scale-0 group-hover:scale-100 transition-transform origin-bottom bg-slate-900 text-white text-xs rounded py-2 px-3">
              {info}
            </div>
          </div>
        )}
      </label>
      <div className="mt-1">
        <input
          type={type}
          name={id}
          id={id}
          value={value as string}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm text-slate-900"
        />
      </div>
    </div>
  );
};

export default Input;