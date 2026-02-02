import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

type IconButtonVariant = 'default' | 'danger';
type IconButtonSize = 'sm' | 'md';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const variantStyles: Record<IconButtonVariant, string> = {
  default: 'text-gray-500 hover:text-deep-space hover:bg-gray-100',
  danger: 'text-gray-500 hover:text-princeton-orange hover:bg-red-50',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        className={`
          inline-flex items-center justify-center
          rounded-lg transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-green focus:ring-offset-1
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
