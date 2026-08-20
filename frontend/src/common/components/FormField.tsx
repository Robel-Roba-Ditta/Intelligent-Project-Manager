import { forwardRef, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, id, ...inputProps }, ref) => {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1.5 block font-mono text-[11px] tracking-wide text-muted uppercase"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent-done/40 ${
            error ? 'border-danger' : 'border-border-light focus:border-accent-done'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
FormField.displayName = 'FormField';
