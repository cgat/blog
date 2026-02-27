import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block zissou-heading text-xs tracking-widest text-inkstain mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2
            border-0 border-b-2 border-dashed border-inkstain
            bg-transparent
            zissou-mono text-center text-inkstain placeholder-inkstain/40
            transition-none
            focus:outline-none focus:border-solid focus:bg-mendls-pink/20
            disabled:bg-cream/50 disabled:cursor-not-allowed disabled:border-dashed
            ${error ? 'border-tracksuit-red' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-tracksuit-red zissou-mono">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
