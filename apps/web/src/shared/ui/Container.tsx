import type { HTMLAttributes } from 'react';
import s from './ui.module.css';
export function Container({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${s.container} ${className}`} {...props} />;
}
