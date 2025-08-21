
export interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}


export interface CustomSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
}


export interface SmartTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  validation?: 'required' | 'email' | 'number';
  error?: string;
  disabled?: boolean;
  className?: string;
}


export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  mode?: 'date' | 'time' | 'datetime';
  min?: Date;
  max?: Date;
  disabled?: boolean;
  className?: string;
}
