'use client';

import { useEffect, useState } from 'react';

const FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Manila',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});

/** "SUN,OCT 11 1:20:26PM" in Philippine time, ticking every second. Empty until mounted so it never mismatches the server render. */
function format(date: Date): string {
  const part = Object.fromEntries(FORMAT.formatToParts(date).map((p) => [p.type, p.value]));
  return `${part.weekday.toUpperCase()}, ${part.month.toUpperCase()} ${part.day} ${part.hour}:${part.minute}:${part.second} ${part.dayPeriod}`;
}

export default function LiveClock({ className = '' }: { readonly className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <time dateTime={now?.toISOString()} className={`whitespace-nowrap tabular-nums ${className}`}>{now ? format(now) : ''}</time>;
}
