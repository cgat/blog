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
            className="block text-sm font-medium text-deep-space mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          className={`
            w-full px-3 py-2
            border rounded-lg
            text-deep-space placeholder-gray-400
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-green focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            resize-none
            ${autoExpand ? 'overflow-hidden' : ''}
            ${error ? 'border-princeton-orange' : 'border-gray-300'}
            ${className}
          `}
          onChange={handleChange}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-princeton-orange">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
