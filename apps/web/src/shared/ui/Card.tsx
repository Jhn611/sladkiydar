import type { HTMLAttributes } from 'react';
import s from './ui.module.css';
export function Card({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`${s.card} ${className}`} {...props} />;
}
