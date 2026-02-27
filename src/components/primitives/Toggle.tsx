import { InputHTMLAttributes, forwardRef } from 'react';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, checked, className = '', ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          className="sr-only peer"
          {...props}
        />
        <div className={`
          relative w-[50px] h-[26px] rounded-full zissou-border
          transition-none
          ${checked ? 'bg-deep-ocean-teal' : 'bg-white'}
          after:content-[''] after:absolute after:top-[2px] after:left-[2px]
          after:w-[18px] after:h-[18px] after:rounded-full
          after:bg-submarine-yellow after:border-2 after:border-inkstain
          after:transition-[left] after:duration-100
          peer-checked:after:left-[26px]
        `}
          style={{ animationTimingFunction: 'steps(2)' }}
        />
        {label && (
          <span className="zissou-mono text-sm text-inkstain">{label}</span>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
