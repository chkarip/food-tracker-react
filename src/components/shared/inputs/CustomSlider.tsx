import React from 'react';
import './CustomSlider.css';

export interface CustomSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const CustomSlider: React.FC<CustomSliderProps> = ({ value, min = 0, max = 100, step = 1, onChange, disabled }) => {
  return (
    <div className="custom-slider">
      <input
        type="range"
        className="slider-input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
      />
      <span className="slider-value">{value}</span>
    </div>
  );
};

export default CustomSlider;
