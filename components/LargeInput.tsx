'use client';

interface LargeInputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  icon?: React.ReactNode;
  minLength?: number;
  maxLength?: number;
}

export default function LargeInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  className = '',
  icon,
  minLength,
  maxLength,
}: LargeInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-lg font-medium text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className={`
            w-full px-6 py-4 text-xl
            border-2 ${error ? 'border-red-500' : 'border-gray-300'}
            rounded-xl
            focus:outline-none focus:ring-4 focus:ring-family-200 focus:border-family-500
            transition-colors
            ${icon ? 'pl-14' : ''}
            placeholder:text-gray-400
          `}
          style={{
            fontSize: '20px',
            lineHeight: '28px',
          }}
        />
      </div>
      {error && (
        <p className="text-lg text-red-600 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-base text-gray-500">{helperText}</p>
      )}
      {maxLength && (
        <p className="text-sm text-gray-400 text-right">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
