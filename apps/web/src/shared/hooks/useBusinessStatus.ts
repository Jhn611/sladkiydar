import { useEffect, useState } from 'react';
export function isBusinessOpen(date: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Moscow',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  return !!weekday && !['Sat', 'Sun'].includes(weekday) && hour >= 9 && hour < 18;
}
export function useBusinessStatus() {
  const [open, setOpen] = useState(() => isBusinessOpen(new Date()));
  useEffect(() => {
    const timer = window.setInterval(() => setOpen(isBusinessOpen(new Date())), 60000);
    return () => window.clearInterval(timer);
  }, []);
  return open;
}
