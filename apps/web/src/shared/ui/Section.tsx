import type { HTMLAttributes } from 'react';
import s from './ui.module.css';
export function Section({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`${s.section} ${className}`} {...props} />;
}
