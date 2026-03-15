'use client';

interface LargeTextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export default function LargeTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  className = '',
  rows = 4,
  maxLength,
}: LargeTextareaProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-lg font-medium text-gray-800">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-6 py-4 text-xl
          border-2 ${error ? 'border-red-500' : 'border-gray-300'}
          rounded-xl
          focus:outline-none focus:ring-4 focus:ring-family-200 focus:border-family-500
          transition-colors
          placeholder:text-gray-400
          resize-none
        `}
        style={{
          fontSize: '20px',
          lineHeight: '28px',
        }}
      />
      <div className="flex justify-between items-center">
        <div>
          {error && (
            <p className="text-lg text-red-600 font-medium">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-base text-gray-500">{helperText}</p>
          )}
        </div>
        {maxLength && (
          <p className="text-sm text-gray-400">
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}
