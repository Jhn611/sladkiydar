import type { HTMLAttributes } from 'react';
import s from './ui.module.css';
export function Text({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`${s.text} ${className}`} {...props} />;
}
