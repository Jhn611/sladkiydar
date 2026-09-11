import type { HTMLAttributes } from 'react';
export function Heading({
  as: Tag = 'h2',
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' }) {
  return <Tag {...props} />;
}
