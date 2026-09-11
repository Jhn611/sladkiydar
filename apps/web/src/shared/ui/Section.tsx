import type { HTMLAttributes } from 'react';
import { useSectionReveal } from '../hooks/useSectionReveal';
import s from './ui.module.css';

export function Section({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  const { ref, revealed } = useSectionReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className={`${s.section} ${className}`}
      data-revealed={revealed || undefined}
      {...props}
    />
  );
}
