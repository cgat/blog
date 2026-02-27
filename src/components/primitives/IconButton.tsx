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
  default: 'text-inkstain/60 hover:text-inkstain hover:bg-submarine-yellow/30',
  danger: 'text-inkstain/60 hover:text-white hover:bg-tracksuit-red',
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
          zissou-border transition-none
          focus:outline-none focus:ring-2 focus:ring-deep-ocean-teal focus:ring-offset-1
          disabled:cursor-not-allowed disabled:border-dashed
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
