import { forwardRef, type ButtonHTMLAttributes } from 'react';
import s from './ui.module.css';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};
export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', className = '', type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={`${s.button} ${s[variant]} ${className}`} {...props} />
  );
});
