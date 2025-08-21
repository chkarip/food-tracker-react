import React from 'react';
import AccentButton from '../AccentButton';
import { NumberStepperProps } from '../../../types/input';
import './NumberStepper.css';

const NumberStepper: React.FC<NumberStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  unit = '',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  const handleDecrement = () => {
    if (!disabled && value - step >= min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (!disabled && value + step <= max) {
      onChange(Math.min(max, value + step));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const stepperClass = [
    'number-stepper',
    `number-stepper--${size}`,
    disabled ? 'number-stepper--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={stepperClass}>
      <AccentButton
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        size={size}
        variant="secondary"
        className="number-stepper__button number-stepper__button--decrement"
      >
        −
      </AccentButton>
      
      <div className="number-stepper__input-container">
        <input
          type="number"
          className="number-stepper__input"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={handleInputChange}
          onBlur={() => {
            // Ensure value stays within bounds on blur
            if (value < min) onChange(min);
            if (value > max) onChange(max);
          }}
        />
        {unit && <span className="number-stepper__unit">{unit}</span>}
      </div>
      
      <AccentButton
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        size={size}
        variant="secondary"
        className="number-stepper__button number-stepper__button--increment"
      >
        +
      </AccentButton>
    </div>
  );
};

export default NumberStepper;
