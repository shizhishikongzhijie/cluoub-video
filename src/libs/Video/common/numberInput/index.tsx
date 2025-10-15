import React, {forwardRef, useImperativeHandle, useState} from 'react';
import './index.css';

interface NumberInputProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface NumberInputRef {
  focus: () => void;
  blur: () => void;
}

const NumberInput = forwardRef<NumberInputRef, NumberInputProps>((props, ref) => {
  const {
    value,
    defaultValue = 0,
    min,
    max,
    step = 1,
    onChange,
    className = '',
    style
  } = props;

  const [innerValue, setInnerValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState(defaultValue.toString());
  const isControlled = value !== undefined;

  const currentValue = isControlled ? value : innerValue;

  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus functionality would be implemented here
    },
    blur: () => {
      // Blur functionality would be implemented here
    }
  }));

  const handleIncrement = () => {
    const newValue = Math.min(
      max !== undefined ? max : Infinity,
      (isControlled ? value : innerValue) + step
    );
    
    if (!isControlled) {
      setInnerValue(newValue);
      setInputValue(newValue.toString());
    }
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(
      min !== undefined ? min : -Infinity,
      (isControlled ? value : innerValue) - step
    );
    
    if (!isControlled) {
      setInnerValue(newValue);
      setInputValue(newValue.toString());
    }
    onChange?.(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setInputValue(inputValue);
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(
        max !== undefined ? max : Infinity,
        Math.max(min !== undefined ? min : -Infinity, numValue)
      );
      
      if (!isControlled) {
        setInnerValue(clampedValue);
      }
      onChange?.(clampedValue);
    }
  };

  const handleInputBlur = () => {
    // When input loses focus, make sure the displayed value matches the actual value
    setInputValue(currentValue.toString());
  };

  return (
    <div className={`number-input-container ${className}`.trim()} style={style}>
      <input
        type="text"
        className="number-input"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
      />
      <div className="number-input-controls">
        <button 
          className="number-input-button number-input-button-up"
          onClick={handleIncrement}
          aria-label="增加"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 12H19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button 
          className="number-input-button number-input-button-down"
          onClick={handleDecrement}
          aria-label="减少"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

export default NumberInput;