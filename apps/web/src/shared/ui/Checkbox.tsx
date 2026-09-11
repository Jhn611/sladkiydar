import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import s from './ui.module.css';
export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode; error?: string }
>(function Checkbox({ label, error, id, ...props }, ref) {
  const uid = useId();
  const fieldId = id ?? uid;
  return (
    <div>
      <div className={s.checkbox}>
        <input
          type="checkbox"
          id={fieldId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        <label htmlFor={fieldId}>{label}</label>
      </div>
      {error && (
        <span className={s.error} id={`${fieldId}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
