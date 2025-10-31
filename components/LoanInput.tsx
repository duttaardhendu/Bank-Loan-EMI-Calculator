
import React from 'react';

interface LoanInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'month';
  icon?: React.ReactNode;
  unit?: string;
}

const LoanInput: React.FC<LoanInputProps> = ({ id, label, value, onChange, placeholder, type = 'text', icon, unit }) => {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-2 font-semibold text-gray-700">{label}</label>
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-gray-800 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${icon ? 'pl-10' : ''} ${unit ? 'pr-12' : ''}`}
        />
        {unit && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">{unit}</div>}
      </div>
    </div>
  );
};

export default LoanInput;
