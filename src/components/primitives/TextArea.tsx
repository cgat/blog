import { TextareaHTMLAttributes, forwardRef, useEffect, useRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoExpand?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, autoExpand = false, className = '', id, onChange, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea && autoExpand) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    useEffect(() => {
      adjustHeight();
    }, [props.value, autoExpand]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoExpand) {
        adjustHeight();
      }
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block zissou-heading text-xs tracking-widest text-inkstain mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={`
            w-full px-3 py-2
            border-0 border-b-2 border-dashed border-inkstain
            bg-transparent
            zissou-mono text-inkstain placeholder-inkstain/40
            transition-none
            focus:outline-none focus:border-solid focus:bg-mendls-pink/20
            disabled:bg-cream/50 disabled:cursor-not-allowed disabled:border-dashed
            resize-none
            ${autoExpand ? 'overflow-hidden' : ''}
            ${error ? 'border-tracksuit-red' : ''}
            ${className}
          `}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-tracksuit-red zissou-mono">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
