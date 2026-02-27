import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-submarine-yellow zissou-border zissou-shadow text-inkstain active:translate-y-[2px] active:bg-tracksuit-red active:text-white active:shadow-none',
  secondary: 'bg-cream zissou-border text-inkstain active:translate-y-[2px] active:bg-mendls-pink active:shadow-none',
  ghost: 'bg-transparent border-2 border-transparent text-inkstain hover:border-inkstain',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center font-bold
          zissou-heading tracking-wider
          transition-none
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-ocean-teal
          ${disabled ? 'cursor-not-allowed border-dashed' : ''}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
