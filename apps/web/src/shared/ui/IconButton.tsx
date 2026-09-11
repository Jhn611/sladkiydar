import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from './Icon';
import s from './ui.module.css';
export function IconButton({
  label,
  name,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; name: IconName }) {
  return (
    <button type="button" aria-label={label} className={`${s.iconButton} ${className}`} {...props}>
      <Icon name={name} />
    </button>
  );
}
