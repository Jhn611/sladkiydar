import { forwardRef, type TextareaHTMLAttributes, useId } from 'react';
import s from './ui.module.css';
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(function Textarea({ label, error, id, ...props }, ref) {
  const uid = useId();
  const fieldId = id ?? uid;
  return (
    <div className={s.field}>
      <label htmlFor={fieldId}>{label}</label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={3}
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
