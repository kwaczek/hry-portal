import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg bg-bg-elevated border border-border-default px-4 py-2.5
            text-text-primary placeholder:text-text-muted
            transition-colors duration-200
            focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-card-red-500/40' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-sm text-card-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
