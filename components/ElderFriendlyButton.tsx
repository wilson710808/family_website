'use client';

interface ElderFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ElderFriendlyButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  disabled = false,
  className = '',
}: ElderFriendlyButtonProps) {
  const variantClasses = {
    primary: 'bg-family-500 hover:bg-family-600 text-white active:bg-family-700',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 active:bg-gray-300 border border-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white active:bg-red-700',
    success: 'bg-green-500 hover:bg-green-600 text-white active:bg-green-700',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-base min-h-[44px]',
    md: 'px-6 py-3 text-lg min-h-[52px]',
    lg: 'px-8 py-4 text-xl min-h-[60px]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        rounded-xl font-semibold transition-all duration-200
        focus:outline-none focus:ring-4 focus:ring-family-200
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
        ${className}
      `}
      style={{
        // 确保触控目标足够大
        minWidth: size === 'lg' ? '120px' : size === 'md' ? '100px' : '80px',
        touchAction: 'manipulation',
      }}
    >
      {children}
    </button>
  );
}
