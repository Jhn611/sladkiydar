import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import s from './ui.module.css';
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function Input({ label, error, id, ...props }, ref) {
  const uid = useId();
  const fieldId = id ?? uid;
  return (
    <div className={s.field}>
      <label htmlFor={fieldId}>{label}</label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <span className={s.error} id={`${fieldId}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
