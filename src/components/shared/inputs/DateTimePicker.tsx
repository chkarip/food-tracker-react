import React from 'react';
import './DateTimePicker.css';

export interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, disabled }) => {
  return (
    <input
      className="date-time-picker"
      type="datetime-local"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

export default DateTimePicker;
