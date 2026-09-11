import type { SVGProps } from 'react';
const paths = {
  'arrow-up-right': 'M5 19 19 5M5 5h14v14',
  'arrow-right': 'M4 12h16m-6-6 6 6-6 6',
  'arrow-left': 'M20 12H4m6-6-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  pause: 'M8 5v14M16 5v14',
  play: 'm8 5 11 7-11 7Z',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  check: 'm5 12 4 4L19 6',
  gift: 'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8C2 8 7-2 12 8Zm0 0c10 0 5-10 0 0Z',
  sparkles: 'm12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z',
  box: 'm3 7 9-5 9 5v10l-9 5-9-5Zm0 0 9 5 9-5M12 12v10M7 4l10 5',
  truck:
    'M3 5h12v12H3zM15 10h4l3 4v3h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  calendar: 'M4 5h16v16H4zM8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 18h2',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  leaf: 'M20 3C8 1 0 10 6 17c7 6 17-2 14-14ZM5 20 16 9',
  mug: 'M4 5h12v10a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM16 7h3a3 3 0 0 1 0 6h-3',
  mail: 'M3 5h18v14H3zM3 5l9 8 9-8',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6',
  globe: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z',
  star: 'm12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z',
  snowflake: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7m-12-3 3.3 3 3.3-3m-6.6 16 3.3-3 3.3 3',
  flower: 'M12 8c-8-12-14 1-5 4-11 8 2 14 5 4 8 11 14-2 5-4 11-8-2-14-5-4Z',
  users:
    'M16 21v-3c0-3-12-3-12 0v3M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 4c5 0 5 7 0 7m2 4c3 0 3 2 3 6',
  clock: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0ZM12 7v5l3 2',
  phone: 'M7 3H3c-2 10 8 20 18 18v-4l-5-2-2 2-7-7 2-2Z',
  pin: 'M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0ZM15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',
};
export type IconName = keyof typeof paths;
export function Icon({
  name,
  size = 22,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
