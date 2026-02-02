import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

export const Chip = forwardRef<HTMLButtonElement, ChipProps>(
  ({ selected = false, removable = false, onRemove, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5
          text-sm font-medium rounded-full
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-green focus:ring-offset-1
          ${selected
            ? 'bg-blue-green text-white'
            : 'bg-sky-blue bg-opacity-50 text-deep-space hover:bg-opacity-75'
          }
          ${className}
        `}
        {...props}
      >
        {children}
        {removable && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onRemove?.();
              }
            }}
            className="ml-0.5 hover:text-princeton-orange"
          >
            ×
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';
