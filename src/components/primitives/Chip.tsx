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
          rounded-none zissou-border
          zissou-mono text-xs uppercase tracking-wide
          transition-none
          focus:outline-none focus:ring-2 focus:ring-deep-ocean-teal focus:ring-offset-1
          ${selected
            ? 'bg-deep-ocean-teal text-white'
            : 'bg-page text-inkstain hover:bg-submarine-yellow'
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
            className="ml-0.5 hover:text-tracksuit-red"
          >
            ×
          </span>
        )}
      </button>
    );
  }
);

Chip.displayName = 'Chip';
