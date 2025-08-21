import React from 'react';
import './SmartTextInput.css';

export interface SmartTextInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  type?: string;
}

const SmartTextInput: React.FC<SmartTextInputProps> = ({ value, placeholder, onChange, disabled, type = 'text' }) => {
  return (
    <input
      className="smart-text-input"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      type={type}
    />
  );
};

export default SmartTextInput;
